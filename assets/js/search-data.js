// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "dropdown-cv",
              title: "CV",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/cv/";
              },
            },{id: "dropdown-publications",
              title: "Publications",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/publications/";
              },
            },{id: "dropdown-teaching",
              title: "Teaching",
              description: "",
              section: "Dropdown",
              handler: () => {
                window.location.href = "/teaching/";
              },
            },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-projects",
          title: "Projects",
          description: "A blossoming collection of my passion projects, with varying degrees of cool-ness.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-repositories",
          title: "Repositories",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/repositories/";
          },
        },{id: "nav-bookshelf",
          title: "Bookshelf",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/books/";
          },
        },{id: "post-l1-l2-and-the-bet-on-sparsity",
        
          title: "L1, L2, and the bet on sparsity",
        
        description: "How do the L1 and L2 norms relate to each other and to the predictive power of statistical models in varying situations?",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/L1-L2-bet-on-sparsity/";
          
        },
      },{id: "post-linear-discriminant-analysis",
        
          title: "Linear Discriminant Analysis",
        
        description: "My notes on LDA from the textbook &quot;An Introduction to Statistical Learning&quot;",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/biostats-week9/";
          
        },
      },{id: "post-shrinkage-methods-ridge-regression-and-the-lasso",
        
          title: "Shrinkage methods, ridge regression, and the LASSO",
        
        description: "My notes on Shrinkage from the textbook &quot;An Introduction to Statistical Learning&quot;",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/biostats-week5/";
          
        },
      },{id: "post-subset-selection",
        
          title: "Subset Selection",
        
        description: "My notes on subset selection methods from the textbook &quot;An Introduction to Statistical Learning&quot;",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/biostats-week4/";
          
        },
      },{id: "books-a-prayer-for-owen-meany",
          title: 'A Prayer for Owen Meany',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/a_prayer_for_owen_meany/";
            },},{id: "books-advanced-calculus",
          title: 'Advanced Calculus',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/advanced_calculus/";
            },},{id: "books-an-album-of-fluid-motion",
          title: 'An Album of Fluid Motion',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/album_fluid_motion/";
            },},{id: "books-animal-farm",
          title: 'Animal Farm',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/animal_farm/";
            },},{id: "books-chaos",
          title: 'Chaos',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/chaos/";
            },},{id: "books-computational-fluid-dynamics-2nd-ed",
          title: 'Computational Fluid Dynamics, 2nd Ed.',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/comp_fluid_dynamics_chung/";
            },},{id: "books-complex-analysis-with-applications",
          title: 'Complex Analysis With Applications',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/complex_analysis_with_app/";
            },},{id: "books-data-driven-science-and-engineering-2nd-ed",
          title: 'Data-Driven Science and Engineering, 2nd Ed.',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/data_driven_science_and_engin/";
            },},{id: "books-div-grad-curl-and-all-that-3rd-ed",
          title: 'div grad curl and all that, 3rd Ed.',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/div_grad_curl_andallthat/";
            },},{id: "books-dune",
          title: 'Dune',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/dune/";
            },},{id: "books-dune-messiah",
          title: 'Dune Messiah',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/dune_messiah/";
            },},{id: "books-the-feynman-lectures-of-physics-volume-1-mainly-mechanics-radiation-and-heat",
          title: 'The Feynman Lectures of Physics, VOLUME 1; Mainly Mechanics, Radiation, and Heat',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/feynman_lec_vol1/";
            },},{id: "books-for-a-new-geography",
          title: 'For a New Geography',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/for_a_new_geography/";
            },},{id: "books-numerical-methods-for-wave-equations-in-geophysical-fluid-dynamics",
          title: 'Numerical Methods for Wave Equations in Geophysical Fluid Dynamics',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/num_methods_wave_eq/";
            },},{id: "books-sapiens",
          title: 'Sapiens',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/sapiens/";
            },},{id: "books-the-fire-next-time",
          title: 'The Fire Next Time',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_fire_next_time/";
            },},{id: "books-the-metamorphosis",
          title: 'The Metamorphosis',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_metamorphosis/";
            },},{id: "books-the-new-jim-crow",
          title: 'The New Jim Crow',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_new_jim_crow/";
            },},{id: "books-the-old-man-and-the-sea",
          title: 'The Old Man and the Sea',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_old_man_and_the_sea/";
            },},{id: "books-the-sun-also-rises",
          title: 'The Sun Also Rises',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_sun_also_rises/";
            },},{id: "books-things-fall-apart",
          title: 'Things Fall Apart',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/things_fall_apart/";
            },},{id: "books-a-thousand-splendid-suns",
          title: 'A Thousand Splendid Suns',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/a_thousand_splendid_suns/";
            },},{id: "books-children-of-dune",
          title: 'Children Of Dune',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/children_of_dune/";
            },},{id: "news-a-simple-inline-announcement",
          title: 'A simple inline announcement.',
          description: "",
          section: "News",},{id: "news-a-long-announcement-with-details",
          title: 'A long announcement with details',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/news/announcement_2/";
            },},{id: "news-a-simple-inline-announcement-with-markdown-emoji-sparkles-smile",
          title: 'A simple inline announcement with Markdown emoji! :sparkles: :smile:',
          description: "",
          section: "News",},{id: "projects-this-website-yes-this-very-one-the-one-you-39-re-on",
          title: 'This website!! Yes, this very one!! The one you&amp;#39;re on!!',
          description: "Do you like this website and want to have one of your very own just like it? No? Do you hate this website and want to make sure you never make one like it? Either way, check out how I did this thing.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{id: "projects-building-a-framework-for-exploratory-geophysical-fluid-dynamics-gfd",
          title: 'Building a framework for exploratory Geophysical Fluid Dynamics (GFD)',
          description: "GFD is cool but hard. What if I could make it easier? Check out my explorations in doing just that.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/2_project/";
            },},{id: "projects-calculating-the-continuous-wavelet-transform",
          title: 'Calculating the continuous wavelet transform',
          description: "A challenge from &quot;A Practical Guide to Wavelet Analysis&quot; (Torrence and Campo, 1997)",
          section: "Projects",handler: () => {
              window.location.href = "/projects/3_project/";
            },},{id: "teachings-gis-and-spatial-analysis",
          title: 'GIS and Spatial Analysis',
          description: "",
          section: "Teachings",handler: () => {
              window.location.href = "/teachings/advanced_gis/";
            },},{id: "teachings-remote-sensing-and-image-interpretation",
          title: 'Remote Sensing and Image Interpretation',
          description: "This course covers the foundational aspects of data science, including data collection, cleaning, analysis, and visualization. Students will learn practical skills for working with real-world datasets.",
          section: "Teachings",handler: () => {
              window.location.href = "/teachings/remote_sensing/";
            },},{
        id: 'social-cv',
        title: 'CV',
        section: 'Socials',
        handler: () => {
          window.open("/assets/pdf/DylanRoyLeo_CV.pdf", "_blank");
        },
      },{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%64%6A%72%6F%79%6C%65%6F@%67%6D%61%69%6C.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-rss',
        title: 'RSS Feed',
        section: 'Socials',
        handler: () => {
          window.open("/feed.xml", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
