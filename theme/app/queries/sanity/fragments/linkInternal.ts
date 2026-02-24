import groq from 'groq';

import {COLOR_THEME} from './colorTheme';

export const LINK_INTERNAL = groq`
  _key,
  _type,
  title,
  hideUnderline,
  hideMobileLink,
  buttonStyle->{
    ${COLOR_THEME}
  },
  ...reference-> {
    "documentType": _type,
    (_type == "collection") => { "slug": "/collections/" + store.slug.current },
    (_type == "home") => { "slug": "/" },
    (_type == "page") => { "slug": "/pages/" + slug.current },
    (_type == "product") => { "slug": "/products/" + store.slug.current },
    (_type == "blogPost") => {
      "slug": "/blog/" + category + "/" + slug.current,
      "category": category
    },
    (_type == "blogCategory") => {
      "slug": "/blog/" + slug.current,
      "category": category
    },
    (_type == "blogLandingPage") => { "slug": slug.current },
    (_type == "blogHome") => { "slug": "/blog" },
    (_type == "wishlistLanding") => { "slug": "/swym/wishlist" }
  }
`;
