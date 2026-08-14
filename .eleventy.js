module.exports = function(eleventyConfig) {
  // Passthrough copy for static assets that should remain unchanged
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("styles.css");
  eleventyConfig.addPassthroughCopy("index.html");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("content-media");

  // Collections for news, ideas, voices
  eleventyConfig.addCollection("news", function(collectionApi) {
    return collectionApi.getFilteredByGlob("content/news/*.md").sort((a, b) => b.date - a.date);
  });
  eleventyConfig.addCollection("ideas", function(collectionApi) {
    return collectionApi.getFilteredByGlob("content/ideas/*.md").sort((a, b) => b.date - a.date);
  });
  eleventyConfig.addCollection("voices", function(collectionApi) {
    return collectionApi.getFilteredByGlob("content/voices/*.md").sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["html","md","njk"]
  };
};
