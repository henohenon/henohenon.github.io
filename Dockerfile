#FROM jekyll/jekyll:latest
FROM ubuntu:latest
RUN mkdir /new_dir

#WORKDIR /srv/jekyll
COPY app/ /new_dir

#RUN bundle install

#EXPOSE 4000

#CMD ["jekyll", "serve", "--watch", "--force_polling", "--livereload"]