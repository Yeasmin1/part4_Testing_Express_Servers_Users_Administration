const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

// The function finds out which blog has the most likes.
//If there are many top favorites, it is enough to return one of them.

const favoriteBlog = (blogs) => {
  const mostLikes = blogs.reduce((favorite, current) => {
    return (current.likes > favorite.likes) ? current : favorite
  })
  return mostLikes
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  const authorBlogCounts = blogs.reduce((counts, blog) => {
    counts[blog.author] = (counts[blog.author] || 0) + 1
    return counts
  }, {})

  const topAuthor = Object.keys(authorBlogCounts).reduce((top, author) => {
    return (authorBlogCounts[author] > authorBlogCounts[top]) ? author : top
  })
  return {
    author: topAuthor,
    blogs: authorBlogCounts[topAuthor]
  }

}

module.exports = {
  dummy, totalLikes,favoriteBlog, mostBlogs,
}