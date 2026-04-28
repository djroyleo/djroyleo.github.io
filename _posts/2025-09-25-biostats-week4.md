---
layout: distill
title: Subset Selection
description: My notes on subset selection methods from the textbook "An Introduction to Statistical Learning"
tags: distill formatting
giscus_comments: true
date: 2025-09-25
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
  - name: Dylan J. Roy-Leo
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
  - name: Subset selection
  - name: Prediction accuracy
    # if a section has subsections, you can add them as follows:
    # subsections:
    #   - name: Example Child Subsection 1
    #   - name: Example Child Subsection 2
  - name: Model interpretability
  - name: Three classes of methods
  - name: Subset selection methods
    subsections:
    - name: Best subset selection
    - name: Forward stepwise selection
    - name: Backward stepwise selection

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

# Subset selection

With the linear model of the form:

$$
Y=\beta_0+\beta_1X_1+\beta_2X_2+\dots+\beta_pX_p+\epsilon
$$

which has many advantages such as simplicity and interpretability and is typically fit with least squares, sometime we can get better results by replacing ordinary least squares fitting with some alternative fitting procedures. Alternative fitting procedures can yield better prediction accuracy.

# Prediction accuracy

- Bias: If the true relationship between the response and the predictors is approximately linear, the least squares estimates will have low bias.
- Variance:
- $n>>p:$ the least squares estimates tend to also have low variance, and hence will perform well on test observations.
- $n$ is not $>>p$: a lot of variability in the least squares fit, resulting in overfitting and consequently poor predictions on future observations not used in model training.
- $p>n$: no longer a unique least squares coefficient estimate, the variance is *infinite* so the method cannot be used at all.

We can constrain or shrink the estimated coefficients, thus, substantially reducing the variance at the cost of a negligible increase in bias. This can lead to substantial improvements in the accuracy with which we can predict the response for observations not used in model training.

# Model interpretability

- Often, some or many of the variables used in multiple regression models are in fact not associated with the response.
    - Leads to unnecessary complexity

# Three classes of methods

1. Subset selection: Identify a subset of the $p$ features that appear to be associated with the response. Then fit a model on those features using least squares.
2. Shrinkage: Use all $p$ features to fit a model using a technique that shrinks coefficient estimates towards zero relative to least squares. This regularization results in reduced variance. Depending on what type of shrinkage is preformed, some of the coefficients may be estimated to be exactly zero. Hence, shrinkage methods can also perform variable selection.
3. Dimension reduction: Project the $p$ predictors onto an M-dimensional subspace ($M < p$). This is achieved by computing $M$ different linear combinations, or projections, of the variables. Then use these $M$ projections as predictors in a model fit using least squares.

# Subset selection methods:

- Simple to understand/implement
- Three types:
    - Best subset selection: consider every possible model and choose the best one
    - Forward step-wise
    - Backwards step-wise

## Best subset selection

Let $M_0$ denote the null model, which contains no predictors. This model simply predicts the sample mean for each observation.

For $k=1,2,\dots,p$:

- Fit all $\begin{pmatrix}
p \\
k
\end{pmatrix}$ models that contain exactly $k$ predictors
- Pick the best among these models, and call it $M_k$. Here best is defined as having the smallest RSS, or equivalently largest $R^2$.

Select a single best model from among, $M_0,\dots,M_p$ using cross-validated prediction error, $C_p(\text{AIC})$, $\text{BIC}$, or adjusted $R^2$.

## Forward stepwise selection

Comments:

- Huge computational advantage over best subset selection: $1+p(p+1)/2$ versus $2^p$
- Not guaranteed to find the best model out of all $2^p$ possible models involving $p$ parameters
- Can be applied even in the high dimensional setting where $n>p$.

## Backward stepwise selection

Starts with a model containing all of the predictors, and remove predictors, one-at-a-time. At each step, remove the predictor that is least useful in predicting the response.

- Let $M_p$ denote the full model, which contains all $p$ predictors.
- For $k=p, p-1, \dots, 1:$
    - Consider all $k$ models that contain all but one of the predictors in $M_k$ for a total of $k-1$ predictor.
    - Choose the best among these $k$ models, and call it $M_{k-1}$. Here best is defined as having the smallest RSS, or highest $R^2$.
- Select a single best model from among $M_0,\dots,M_p$ using cross validated prediction error, $C_p(\text{AIC})$, $\text{BIC}$ or adjusted $R^2$.

Comments:

- Like forward stepwise, backward stepwise has a huge computational advantage over best subset selection (exact computational advantage is the same as forwards stepwise).
- Like forward stepwise, not guaranteed to fin the best model out of all $2^p$ possible models involving $p$ predictors.
- Unlike forward stepwise, can be applied only when $n>p$: must have more observations than features in order to fit the initial model containing all predictors.