import { Client } from '@notionhq/client'
import { GetStaticProps, NextPage } from 'next';
import styles from '../styles/Home.module.css';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import prism from 'prismjs';

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

export type Content =
  | {
      type:
        | 'paragraph'
        | 'quote'
        | 'heading_2'
        | 'heading_3';
      text: string | null;
    }
  | {
      type: 'code';
      text: string | null;
      language: string | null;
    };

export type Post = {
  id: string;
  title: string | null;
  slug: string | null;
  createdTs: string | null;
  lastEditedTs: string | null;
  contents: Content[];
};

type StaticProps = {
  posts: Post[];
};

export const getPosts = async () => {
  const database = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID || '',
    filter: {
      and: [
        {
          property: 'Published',
          checkbox: { equals: true }
        }
      ]
    },
    sorts: [
      { timestamp: 'created_time', direction: 'descending' }
    ]
  });

  const posts: Post[] = [];

  database.results.forEach((page, index) => {
    if (!page || page.object !== 'page') {
      return;
    }

    if (!('properties' in page)) {
      posts.push({
        id: page.id,
        title: null,
        slug: null,
        createdTs: null,
        lastEditedTs: null,
        contents: []
      })
      return;
    };

    let title: string | null = null;
    if (page.properties['Name'].type === 'title') {
      title = page.properties['Name'].title[0]?.plain_text ?? null;
    }

    let slug: string | null = null;
    if (page.properties['Slug'].type === 'rich_text') {
      slug = page.properties['Slug'].rich_text[0]?.plain_text ?? null;
    }

    posts.push({
      id: page.id,
      title,
      slug,
      createdTs: page.created_time,
      lastEditedTs: page.last_edited_time,
      contents: []
    });
  });

  return posts;
};

const Home: NextPage<StaticProps> = ({ posts }) => {
  useEffect(() => {
    prism.highlightAll();
  }, []);

  return (
    <div className={styles.wrapper}>
      {posts.map((post) => (
        <div className={styles.post} key={post.id}>
          <h1 className={styles.title}>{post.title}</h1>

          <div className={styles.timestampWrapper}>
            <div>
              <div className={styles.timestamp}>
                作成日時:{' '}
                {
                  dayjs(post.createdTs).format(
                    'YYYY-MM-DD HH:mm:ss'
                  )
                }
              </div>
              <div className={styles.timestamp}>
                更新日時:{' '}
                {
                  dayjs(post.lastEditedTs).format(
                    'YYYY-MM-DD HH:mm:ss'
                  )
                }
              </div>
            </div>
          </div>

          <div>
            {post.contents.map((content, index) => {
              const key = `${post.id}_${index}`;
              switch(content.type) {
                case 'heading_2':
                  return (
                    <h2 key={key} className={styles.heading2}>
                      {content.text}
                    </h2>
                  );

                case 'heading_3':
                  return (
                    <h3 key={key} className={styles.heading3}>
                      {content.text}
                    </h3>
                  );

                case 'paragraph':
                  return (
                    <p key={key} className={styles.paragraph}>
                      {content.text}
                    </p>
                  );

                case 'code':
                  return (
                    <pre key={key} className={`styles.code lang-${content.language}`}>
                      {content.text}
                    </pre>
                  );

                case 'quote':
                  return (
                    <blockquote key={key} className={styles.quote}>
                      {content.text}
                    </blockquote>
                  );
              }
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;
