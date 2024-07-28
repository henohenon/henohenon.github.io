FROM jekyll/jekyll:latest

WORKDIR /srv/jekyll
COPY app/ /srv/jekyll

RUN bundle install

EXPOSE 4000

CMD ["jekyll", "serve", "--watch", "--force_polling", "--livereload"]