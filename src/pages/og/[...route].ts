import { OGImageRoute } from 'astro-og-canvas'
import { getCollection } from 'astro:content'

// 블로그 포스트 가져오기
const blogs = await getCollection(
  'blog',
  (post) => !post.data.draft && !post.data.image,
)

// 포스트 데이터를 Object로 변환
const pages = Object.fromEntries(blogs.map(({ id, data }) => [id, data]))

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'route',
  pages,

  // 각 페이지에 대한 OG 이미지 옵션 설정
  getImageOptions: (path, data) => ({
    title: data.title,
    description: data.description || '',

    // bgGradient: [
    //   [224, 195, 252],
    //   [142, 197, 252],
    // ],

    bgImage: {
      path: `./src/content/blog/${path.split('/').pop()}/assets/background.webp`,
    },

    // 폰트 설정
    font: {
      title: {
        color: [0, 0, 0],
        size: 100,
        lineHeight: 1.2,
        families: ['Pretendard', 'JetBrainsMono'],
        weight: 'Bold',
      },
      description: {
        color: [0, 0, 0],
        size: 50,
        lineHeight: 1.5,
        families: ['Pretendard', 'JetBrainsMono'],
        weight: 'Light',
      },
    },

    fonts: [
      './public/fonts/Pretendard-Regular.woff2',
      './public/fonts/JetBrainsMono[wght].woff2',
    ],

    padding: 60,
  }),
})
