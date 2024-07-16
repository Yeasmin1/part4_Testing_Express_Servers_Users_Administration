const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const helper = require('./blog_helper')
const User = require('../models/user')
const Blog = require('../models/blog')


describe('when there is initially some  blogs saved' , async () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash: passwordHash })
    await user.save()
    const updatedIntialBlogWithUserId = await helper.updateInitialBlogs(user.id)
    await Blog.insertMany(updatedIntialBlogWithUserId)
  })

  test('blogs are returned as json', async () => {
    const token = await helper.getTokenHelper()
    await api
      .get('/api/blogs')
      .set('authorization', `bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('blog posts have an id property instead of _id', async () => {
    const token = await helper.getTokenHelper()

    const response = await api
      .get('/api/blogs')
      .set('authorization', `bearer ${token}`)

    assert.strictEqual(response.body.length, 2)
    response.body.map(blog => {
      assert(blog.id !== undefined)
      assert(blog._id === undefined)
    })
  })

  test('a valid blog can be added with a valid token', async () => {
    const token = await helper.getTokenHelper()
    const  newBlog = {
      title: 'New blog post',
      author:'New Author',
      url: 'http://example.com/new',
      likes: 5,
    }
    const blogsAtStart = await helper.blogsInDb()

    await api
      .post('/api/blogs')
      .set('authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/ )

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length + 1)
    const savedBlog = blogsAtEnd.find(blog => blog.title === newBlog.title)
    assert.strictEqual(savedBlog.title, newBlog.title)
    const decodedToken = jwt.verify(token, process.env.SECRET)
    assert.strictEqual(savedBlog.user.toString(), decodedToken.id.toString())
  })

  test('when like property is missing from the request, it will default to the value 0', async () => {
    const token = await helper.getTokenHelper()
    const newBlog = {
      title: 'New blog',
      author:'New Author',
      url: 'http://example.com/new',
    }

    const response = await api
      .post('/api/blogs')
      .set('authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blog = response.body
    assert.strictEqual(blog.likes, 0)
  })

  test ('when title or url properties are missing from the request data, the backend responds to the request with the status code 400 Bad Request.', async () => {
    const token = await helper.getTokenHelper()
    const newBlog = {
      author:'New Author',
      likes: 5,
    }

    await api
      .post('/api/blogs')
      .set('authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(400)
  })

  test('updates the number of likes for a blog post', async () => {
    const token = await helper.getTokenHelper()
    const blogsAtStart = await helper.blogsInDb()
    if (blogsAtStart.length === 0) {
      return
    }
    const blogToUpdate = blogsAtStart[0]
    const updatedBlogData = { likes: 6 }

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('authorization', `bearer ${token}`)
      .send(updatedBlogData)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const updatedBlog = response.body
    assert.strictEqual(updatedBlog.likes, 6)
    const blogsAtEnd = await helper.blogsInDb()
    const updatedBlogIdString = updatedBlog._id.toString()
    const updatedBlogFromDb = blogsAtEnd.find(blog => blog.id.toString() === updatedBlogIdString )
    assert.strictEqual(updatedBlogFromDb.likes, 6)
  })

  test('deletes a blog post only if user is the creator', async () => {
    const token = await helper.getTokenHelper()
    const blogsAtStart = await helper.blogsInDb()
    if (blogsAtStart.length === 0) {
      return
    }
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('authorization', `bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)
    blogsAtEnd.map(blog => {
      assert(blog._id !== blogToDelete.id)
    })
  })
})

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash: passwordHash })
    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()
    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)
    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()
    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

describe('token authentication test', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash: passwordHash })
    await user.save()
  })

  test('token authentication successful for a valid username and password', async() => {
    const loginDetails = {
      username: 'root',
      password: 'sekret'
    }

    const response = await api
      .post('/api/login')
      .send(loginDetails)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const token = response.body.token
    assert(token !== undefined)
    const decodedToken = jwt.verify(token, process.env.SECRET)
    assert.strictEqual(decodedToken.username, loginDetails.username)
  })
})

after(async () => {
  await User.deleteMany({})
  await mongoose.connection.close()
})