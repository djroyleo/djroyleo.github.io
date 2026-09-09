---
layout: book-review
title: An Introduction to Statistical Learning with Applications in R
author: James, Witten, Hastie, Tibshirani, & Taylor
isbn: 9781461471370
categories: machine-learning statistics mathematics
tags: top-100
date: 2026-06-03
started: 2025-09-01
finished: 2025-12-14
released: 2013
stars: 5
status: finished
---
# 4 - Classification
## 4.4 - Generative Models for Classification

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

# 6 - Linear Model Selection and Regularization
## 6.1 - Subset Selection

With the linear model of the form:

$$
Y=\beta_0+\beta_1X_1+\beta_2X_2+\dots+\beta_pX_p+\epsilon
$$

which has many advantages such as simplicity and interpretability and is typically fit with least squares, sometime we can get better results by replacing ordinary least squares fitting with some alternative fitting procedures. Alternative fitting procedures can yield better prediction accuracy.

### Prediction accuracy

- Bias: If the true relationship between the response and the predictors is approximately linear, the least squares estimates will have low bias.
- Variance:
- $n>>p:$ the least squares estimates tend to also have low variance, and hence will perform well on test observations.
- $n$ is not $>>p$: a lot of variability in the least squares fit, resulting in overfitting and consequently poor predictions on future observations not used in model training.
- $p>n$: no longer a unique least squares coefficient estimate, the variance is _infinite_ so the method cannot be used at all.

We can constrain or shrink the estimated coefficients, thus, substantially reducing the variance at the cost of a negligible increase in bias. This can lead to substantial improvements in the accuracy with which we can predict the response for observations not used in model training.

### Model interpretability

- Often, some or many of the variables used in multiple regression models are in fact not associated with the response.
  - Leads to unnecessary complexity

### Three classes of methods

1. Subset selection: Identify a subset of the $p$ features that appear to be associated with the response. Then fit a model on those features using least squares.
2. Shrinkage: Use all $p$ features to fit a model using a technique that shrinks coefficient estimates towards zero relative to least squares. This regularization results in reduced variance. Depending on what type of shrinkage is preformed, some of the coefficients may be estimated to be exactly zero. Hence, shrinkage methods can also perform variable selection.
3. Dimension reduction: Project the $p$ predictors onto an M-dimensional subspace ($M < p$). This is achieved by computing $M$ different linear combinations, or projections, of the variables. Then use these $M$ projections as predictors in a model fit using least squares.

### Subset selection methods:

- Simple to understand/implement
- Three types:
  - Best subset selection: consider every possible model and choose the best one
  - Forward step-wise
  - Backwards step-wise

#### Best subset selection

Let $M_0$ denote the null model, which contains no predictors. This model simply predicts the sample mean for each observation.

For $k=1,2,\dots,p$:

- Fit all $\begin{pmatrix}
p \\
k
\end{pmatrix}$ models that contain exactly $k$ predictors
- Pick the best among these models, and call it $M_k$. Here best is defined as having the smallest RSS, or equivalently largest $R^2$.

Select a single best model from among, $M_0,\dots,M_p$ using cross-validated prediction error, $C_p(\text{AIC})$, $\text{BIC}$, or adjusted $R^2$.

#### Forward stepwise selection

Comments:

- Huge computational advantage over best subset selection: $1+p(p+1)/2$ versus $2^p$
- Not guaranteed to find the best model out of all $2^p$ possible models involving $p$ parameters
- Can be applied even in the high dimensional setting where $n>p$.

#### Backward stepwise selection

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

### Takeaways

- Naive use of classical linear model theory after model selection ignores data-dependence and is generally invalid.
- With AIC/BIC, overfitted models yield downward-biased error variance estimates.
- As a result, AIC-based prediction intervals are too short and undercover.
- Be cautious when reporting uncertainty after AIC/BIC-based selection.
- Consider selective/post-selective inference methods or fully pre-specified models.

## 6.2 - Shrinkage Methods

- _Shrinkage methods_ fit a model using all _p_ predictors, using a technique that **shrinks** or **regularizes** the coefficient estimates towards zero.

### Ridge regression

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

$\lambda \ge 0$ is a _tuning parameter_ that controls the amount of shrinkage

- When $\lambda=0$, get least squares estimates.
- When $\lambda > 0$, get estimates that shrunken towards zero.

$\lambda\sum_{j=1}^p\beta_j^2$ : shrinkage penalty

The shrinkage penalty is applied to $\beta_1, \ \beta_2, \ \dots, \ \beta_p$ but not to the intercept $\beta_0$.

### Ridge regression matrix expression

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

#