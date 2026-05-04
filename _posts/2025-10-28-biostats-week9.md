---
layout: distill
title: Linear Discriminant Analysis
description: My notes on LDA from the textbook "An Introduction to Statistical Learning"
tags: statistical-learning machine-learning LDA
date: 2025-10-28
featured: true
mermaid:
  enabled: true
  zoomable: true
code_diff: true
map: true
chart:
  chartjs: true
  echarts: true
  vega_lite: true
tikzjax: true
typograms: true
giscus_comments: true

authors:
  - name: Dylan J Roy-Leo
    url: "https://djroyleo.github.io"
    affiliations:
      name: UMass

bibliography: 2018-12-22-distill.bib

# Optionally, you can add a table of contents to your post.
# NOTES:
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - we may want to automate TOC generation in the future using
#     jekyll-toc plugin (https://github.com/toshimaru/jekyll-toc).
toc:
  - name: Linear Discriminant Analysis (LDA)

# Below is an example of injecting additional post-specific styles.
# If you use this post as a template, delete this _styles block.
_styles: >
  .fake-img {
    background: #bbb;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 0px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 12px;
  }
  .fake-img p {
    font-family: monospace;
    color: white;
    text-align: left;
    margin: 12px 0;
    text-align: center;
    font-size: 16px;
  }
---

# Linear Discriminant Analysis (LDA)

$$
Pr(Y=k|X=x)=\frac{\pi_k \frac{1}{\sqrt{2\pi}\sigma}e^{-\frac{1}{2}\left( \frac{x-\mu_k}{\sigma} \right)^2}}{\sum_{l=1}^{K}\pi_l\frac{1}{\sqrt{2\pi}\sigma}e^{-\frac{1}{2}\left( \frac{x-\mu_l}{\sigma} \right)^2}}
$$

- Does a very good job at determining the probability than an observation $\left(Y,X\right)$ belong to a certain class given a value of $X$.
- The log odds derived from LDA is a linear function of predictor $X$.
- This linearity is a consequence of the Gaussian assumption for the class densities, as well as the assumption of a common covariance matrix.
- As seen, LSA and logistics regression have the same form of log odds. Both of whicha re linear functions of $x$. The only difference is the way the parameters are estimated. This same connection between LDA and logistic regression also holds for multidimensional data wit multiple predictors.
- In general, logistic regression is safer than LDA because LDA has strong assumptions about the normal distribution of $X$ and strong assumptions about the covariance matrix.
- LDA is useful:
  - when $n$ is small
  - or the classes are well separated
  - and Gaussian assumptions are reasonable
