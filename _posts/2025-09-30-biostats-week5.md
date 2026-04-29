---
layout: distill
title: Shrinkage methods, ridge regression, and the LASSO
description: My notes on Shrinkage from the textbook "An Introduction to Statistical Learning"
tags: statistical-learning machine-learning shrinkage-methods ridge-regression LASSO
date: 2025-09-30
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
  - name: Shrinkage methods
    subsections:
    - name: Ridge regression
    - name: Ridge regression matrix expression

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

# Shrinkage methods

- *Shrinkage methods* fit a model using all *p* predictors, using a technique that **shrinks** or **regularizes** the coefficient estimates towards zero.

## Ridge regression

Least squares seeks $\beta_0, \ \beta_1, \ \dots, \ \beta_p$ that minimizes

$$
RSS=\sum_{i=1}^n \left(
y_i-\beta_0-\sum_{j=1}^p \beta_jx_{jj}
\right)^2
$$

Ridge regression seeks $\beta_0, \ \beta_1, \ \dots, \ \beta_p$ that minimizes

$$
\sum_{i=1}^n \left(
y_i-\beta_0-\sum_{j=1}^p \beta_jx_{jj}
\right)^2
+
\lambda\sum_{j=1}^p\beta_j^2=RSS+\lambda\sum_{j=1}^p\beta_j^2
$$

$\lambda \ge 0$ is a *tuning parameter* that controls the amount of shrinkage

- When $\lambda=0$, get least squares estimates.
- When $\lambda > 0$, get estimates that shrunken towards zero.

$\lambda\sum_{j=1}^p\beta_j^2$ : shrinkage penalty

The shrinkage penalty is applied to $\beta_1, \ \beta_2, \ \dots, \ \beta_p$ but not to the intercept $\beta_0$.

## Ridge regression matrix expression

Assume that $y=(y_1, \ \dots, \ y_n)^T$ is centered. Let $\beta = (\beta_1, \ \dots, \ \beta_p)^T$ and 

$$
X=\begin{bmatrix}
X_{11} & X_{12} & \dots & X_{1p} \\
X_{21} & X_{22} & \dots & X_{2p} \\
\vdots & \vdots & \ddots & \vdots \\
X_{n1} & X_{n2} & \dots & X_{np}
\end{bmatrix}
$$

Ridge regression seeks $\beta$ that minimizes the following penalized residual sum of squares (**PRSS**).

$$
PRSS(\beta)=(y-X\beta)^T(y-X\beta)+\lambda\|\beta\|_2^2
$$

Take derivatives, we obtain

$$
\frac{\partial PRSS(\beta)}{\partial\beta}=-2X^T(y-X\beta)+2\lambda\beta
$$

The solution to $PRSS(\beta)$ is

$$
\hat{\beta}_{\lambda}^{\ ridge}=(X^TX+\lambda I_p)^{-1}X^Ty
$$

Even if $X^TX$ is not invertible, inclusion of $\lambda$ makes the problem non-singular. This was the original motivation for ridge regression (Hoerl & Kennard, 1970).