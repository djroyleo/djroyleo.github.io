---
layout: page
title: Calculating the continuous wavelet transform
description: A challenge from "A Practical Guide to Wavelet Analysis" (Torrence and Campo, 1997)
img: assets/img/3.jpg
importance: 3
category: nerd-stuff
---


 The continuous wavelet transform, or CWT, and its cousin the discrete wavelet transform, or DWT, have been described as a type of mathematical microscope that allow scientists and mathematicians to view signals in both the time domain as well as the frequency domain. While there exists plenty of Python libraries and packages that will allow you to easily perform CWT and DWT on your time series data with only a few lines of code, I want to give myself a bit more of a challenge. 

In the foundational 1997 paper (foundational at least in the Geosciences) titled "A Practical Guide to Wavelet Analysis" the authors state on page 4 that:

> Using (4) and a standard Fourier transform routine, one can calculate the continuous wavelet transform (for a given $s$) at all $n$ simultaneously and efficiently.
> 
> (Torrence and Campo, 1997)

In this case $s$ is referring to the *wavelet scale* and $n$ is, naturally, referring to the $N$ discrete and evenly spaced points along the time series. The equation (4) that is referenced here is referring to the following:
$$
\begin{equation}
W_n(s)=\sum_{k=0}^{N-1}\hat{x}_k\hat{\psi}*\left(s\omega_k\right)e^{i\omega_kn\delta t}
\end{equation}
$$
where $\hat{\psi}$ is the wavelet function (variable, but commonly a Morlet wavelet, the equation for which will be referenced at the end of this article). The $\hat{x}_k$ and $\hat{\psi}$ notation is used instead of $x_k$ and $\psi$ to indicate that we are operating in the frequency domain (we transformed both time series and wavelet using the aforementioned "Fourier transform routine"). The reason for conducting this computation in the frequency domain is due to the *convolution theorem* which states that the inverse Fourier transform of the above equation (eq. (4)) is the wavelet transform. If not for the convolution theorem and computation in the frequency domain, we could theoretically compute the wavelet transform in the data-native time domain, but it would be slower and more computationally intensive. This would look like the following:
$$
\begin{equation}
W_n(s)=\sum_{n^`=0}^{N-1}x_{n^`}\psi*\left[\frac{(n^`-n)\delta t}{s}\right]
\end{equation}
$$
where ($*$) is the complex conjugate. Again, $x_n$ here is a discrete sequence (most commonly a time series, and assumed to be evenly space), meaning that this formulation is the discrete application of the CWT. If we wanted to think of the continuous formulation we would use the following:
$$
\begin{equation}
\mathcal{W}_\psi(f)=\langle f,\psi\rangle=\int_{-\infty}^\infty f(t)\bar{\psi}(t)\space\text{d}t
\end{equation}
$$
where $\bar{\psi}$ denotes the complex conjugate. The change in notation from $W$ to $\mathcal{W}$ to denote the wavelet transform is to differentiate the discrete and continuous formulations, respectively.

The last thing that we need to know to start coding up this computation on an example dataset is the definition of the *angular frequency* $\omega_k$, which we will define as:

$$
\begin{equation}
\omega_k = 
\begin{cases}
\frac{2\pi k}{N\delta t} & \text{if} \space k\leq \frac{N}{2}\\
-\frac{2\pi k}{N\delta t} & \text{if} \space k \gt \frac{N}{2}
\end{cases}
\end{equation}
$$
