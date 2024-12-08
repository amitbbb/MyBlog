import Head from 'next/head';
import Link from 'next/link';
import { gql } from '@apollo/client';
import { getApolloClient } from 'lib/apollo-client';
import { useState } from 'react';
import styles from '../styles/Home.module.css';
import Header from 'components/Header';
import Footer from 'components/Footer';

export default function Home({ page, posts, categories, tags }) {
  const { title, description } = page;

  // State for filters and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  
  const postsPerPage = 12;

  // Filter posts based on search, category, and tag
  const filteredPosts = posts.filter((post) => {
    const searchMatch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    // Fix for categories: Access nodes array
    const categoryMatch = selectedCategory 
      ? post.categories.nodes.some(category => category.slug === selectedCategory) 
      : true;

    // Fix for tags: Access nodes array
    const tagMatch = selectedTag 
      ? post.tags.nodes.some(tag => tag.slug === selectedTag) 
      : true;

    return searchMatch && categoryMatch && tagMatch;
  });

  // Calculate the displayed posts
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  // Calculate total pages
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  // Change page
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header title={title} />
      <main className={styles.main}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search posts"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchBox}
        />

        {/* Category Filter */}
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>

        {/* Tag Filter */}
        <select 
          value={selectedTag} 
          onChange={(e) => setSelectedTag(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Tags</option>
          {tags.map(tag => (
            <option key={tag.id} value={tag.slug}>
              {tag.name}
            </option>
          ))}
        </select>

        <ul className={styles.grid}>
  {currentPosts && currentPosts.length > 0 && currentPosts.map((post) => (
    <li key={post.slug} className={styles.card}>
      <Link href={post.path}>  {/* This will now correctly link to /posts/[slug] */}
        {/* Display Featured Image */}
        {post.featuredImage && post.featuredImage.node.sourceUrl && (
          <img 
            src={post.featuredImage.node.sourceUrl} 
            alt={post.title} 
            className={styles.featuredImage} 
          />
        )}
        <h3
          dangerouslySetInnerHTML={{
            __html: post.title,
          }}
        />
      </Link>
      <div
        dangerouslySetInnerHTML={{
          __html: post.excerpt,
        }}
      />
    </li>
  ))}

  {!currentPosts || currentPosts.length === 0 && (
    <li>
      <p>Oops, no posts found!</p>
    </li>
  )}
</ul>

        {/* Pagination controls */}
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              className={currentPage === pageNumber ? styles.active : ''}
              onClick={() => handlePageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      </main>
      <Footer/>
    </div>
  );
}

export async function getStaticProps() {
  const apolloClient = getApolloClient();

  const data = await apolloClient.query({
    query: gql`
      {
        generalSettings {
          title
          description
        }
        posts(first: 10000) {
          edges {
            node {
              id
              excerpt
              title
              slug
              uri
              featuredImage {
                node {
                  sourceUrl
                }
              }
              categories {
                nodes {
                  slug
                  name
                  id
                }
              }
              tags {
                nodes {
                  slug
                  name
                  id
                }
              }
            }
          }
        }
        categories {
          nodes {
            id
            name
            slug
          }
        }
        tags {
          nodes {
            id
            name
            slug
          }
        }
      }
    `,
  });

  const posts = data?.data.posts.edges.map(({ node }) => node).map((post) => ({
    ...post,
    path: `/posts/${post.slug}`,  // Ensure the path is correctly set to '/posts/[slug]'
  }));

  const categories = data?.data.categories.nodes || [];
  const tags = data?.data.tags.nodes || [];

  const page = {
    ...data?.data.generalSettings,
  };

  return {
    props: {
      page,
      posts,
      categories,
      tags,
    },
  };
}

