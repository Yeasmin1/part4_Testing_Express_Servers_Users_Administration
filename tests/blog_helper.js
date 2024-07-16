const Blog = require('../models/blog')
const User = require('../models/user')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const getTokenHelper = async() => {
  const loginDetails = {
    username: 'root',
    password: 'sekret'
  }
  const loginResponse = await api
    .post ('/api/login')
    .send(loginDetails)
    .expect(200)
    .expect('Content-Type', /application\/json/ )
  const token = loginResponse.body.token
  return token
}

const initialBlogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
    user: 'USER'
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    user: 'USER'
  }
]

// Replace the initilBlogs object's user filed with the proper userId
const updateInitialBlogs = async (userId) => {
  const updatedBlogs = initialBlogs.map(blog => ({
    ...blog,
    user: userId
  }))
  return updatedBlogs
}

const initialUser =
  {
    username: 'test1',
    name: 'test1',
    password: 'salainen',
  }

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialBlogs, blogsInDb, usersInDb, initialUser, getTokenHelper,updateInitialBlogs
}