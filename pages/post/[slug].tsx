import { GetStaticPaths } from "next";
import { getPosts } from "..";

type StaticPathsParams = {
  slug: string;
};

export const getStaticPaths: GetStaticPaths<StaticPathsParams> = async () => {
  const posts = await getPosts()
  const paths: { params: { slug: string } }[] = [];

  posts.forEach((post) => {
    const slug = post.slug;

    if (slug) {
      paths.push({
        params: { slug }
      });
    }
  });

  return { paths, fallback: 'blocking' };
}
