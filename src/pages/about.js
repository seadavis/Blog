import React from "react"
import { graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"

const BlogIndex = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const posts = data.allMarkdownRemark.nodes

    return (
      <Layout location={location} title={siteTitle}>
        <SEO title="All posts" />
        <p>
          Hello my name is Sean Davis, and I am a Senior Software Engineer  at
          <a href="https://mobiledatatech.com/">&nbsp;MDT</a><br />
        </p>
        <p>
          Professionally speaking I am most passionate about, software
          safety (that is how to write correct programs, and fault-tolerant 
          programs), and performance.
        </p>
        <p>
          On my philosophy of programming my biggest influences have been,
          &nbsp;<a href="http://conal.net/">Conal Elliott</a>, 
          &nbsp;<a href="https://rd.microsoft.com/en-us/billy-hollis">Billy Hollis</a>
          , and 
          &nbsp;<a href="https://pragprog.com/">the pragmatic programmers</a>
        </p>
        <p>
          This blog is a place for me to write down what I am experimenting
          with. Almost as a Journal for the current state of my thoughts.
          Hopefully somebody else also finds it useful.
        </p>
        <p>
          When I'm not coding, thinking about coding, learning about coding or
          obsessing about coding I am runing marathons
          as well as spending time in the great outdoors with my 
          partner.
        </p>
        <Bio></Bio>
      </Layout>
    )

}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          description
        }
      }
    }
  }
`
