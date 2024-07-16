const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const body = request.body
  const user = request.user
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url ,
    likes: body.likes !== undefined ? body.likes :0,
    user: user.id
  })
  if ((blog.title === undefined) || (blog.url === undefined)) {
    response.status(400).end()
  }
  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id',async (request, response) => {
  const user = request.user
  if (!user) {
    return response.status(401).json({ error: 'user not found' })
  }
  const blog = await Blog.findById(request.params.id)
  if (!blog) {
    return response.status(404).json({ error: 'blog not found' })
  }
  if (blog.user.toString() !== user.id.toString()) {
    return response.status(403).json({ error: 'only the creator can delete this blog' })
  }
  await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body
  const user = request.user
  if (!user) {
    return response.status(401).json({ error: 'user not found' })
  }
  const readBlog = await Blog.findById(request.params.id)
  if (!readBlog) {
    return response.status(404).json({ error: 'blog post not found' })
  }
  // this condition is to ensure the user is authorized to update the blog post
  if (readBlog.user.toString() !== user._id.toString()) {
    return response.status(401).json({ error: 'unauthorized to update this blog post' })
  }
  const blog = {
    title: body.title === undefined ? readBlog.title : body.title,
    author: body.author === undefined ? readBlog.author : body.author,
    url: body.url === undefined ? readBlog.url : body.url,
    likes: body.likes === undefined ? readBlog.likes : body.likes,
    user: readBlog.user
  }
  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog , { new: true })
  if (updatedBlog) {
    response.json(updatedBlog.toObject())
  } else {
    response.status(404).json({ error: 'blog post not found' })
  }

})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

module.exports = blogsRouter