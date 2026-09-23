'use strict'

const pagination = require('hexo-pagination')

// 博客的两大板块：技术栏 / 生活栏
// 每个板块生成一个独立的文章列表页，按文章分类名筛选
const SECTIONS = [
  {
    name: '技术',
    slug: 'tech',
    desc: '学习笔记与技术知识'
  },
  {
    name: '生活',
    slug: 'life',
    desc: '感想与感悟'
  }
]

hexo.extend.generator.register('section_pages', function (locals) {
  const perPage = this.config.per_page || 10
  const paginationDir = this.config.pagination_dir || 'page'

  return SECTIONS.reduce((result, section) => {
    const posts = locals.posts
      .toArray()
      .filter(post => post.categories.toArray().some(category => category.name === section.name))
      .sort((a, b) => b.date.valueOf() - a.date.valueOf())

    const extra = {
      category: section.name,
      section_title: section.name,
      section_desc: section.desc
    }

    // 板块暂无文章时，hexo-pagination 不会生成任何页面，这里手动补一个空列表页
    if (!posts.length) {
      return result.concat([
        {
          path: `${section.slug}/`,
          layout: ['section'],
          data: Object.assign(
            {
              base: `${section.slug}/`,
              total: 1,
              current: 1,
              current_url: `${section.slug}/`,
              posts: [],
              prev: 0,
              prev_link: '',
              next: 0,
              next_link: ''
            },
            extra
          )
        }
      ])
    }

    return result.concat(
      pagination(`${section.slug}/`, posts, {
        perPage,
        layout: ['section'],
        format: `${paginationDir}/%d/`,
        data: extra
      })
    )
  }, [])
})
