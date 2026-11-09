// The former Workers site now consolidates all traffic on the Pages custom domain.
export default {
  fetch(request) {
    const destination = new URL(request.url);
    destination.protocol = 'https:';
    destination.host = 'www.bionicmarkdown.com';
    if (destination.pathname === '/index.html') destination.pathname = '/';
    if (destination.pathname === '/about.html') destination.pathname = '/about';
    return Response.redirect(destination.href, 301);
  },
};
