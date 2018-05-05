jQuery( document ).ready( function ( $ ) {
    const WATU_TMDB_ROOT       = "https://api.themoviedb.org/3";
    const WATU_TMDB_ROOT_KEY   = "&api_key=f9cf4ece2f9aeccbe524aaa92a1515ae&append_to_response=videos,images,credits,similar_movies";
    const WATU_TMDB_ROOT_LANG  = "?language=en-US";
    const WATU_TMDB_ROOT_MOVIE = WATU_TMDB_ROOT + "/movie/";
    const WATU_TMDB_ROOT_DISC  = WATU_TMDB_ROOT + "/discover/movie?api_key=f9cf4ece2f9aeccbe524aaa92a1515ae&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=";

    const MOVIE_STORAGE = '' + $( '.movie-storage' ).data( 'id' );

    $( '#movie-creation-form' ).on( 'submit', function(e) {
        e.preventDefault();
        watu_call_tmdb_connect();
    });

    /*
    async function fetch_fetch(movieId) {
      const response = await fetch('https://api.themoviedb.org/3/movie/' + movieId + '?language=en-US&api_key=f9cf4ece2f9aeccbe524aaa92a1515ae&append_to_response=videos,images,credits')
      const data = await response.json()
      console.log(data);
      return data
    }

    const result = fetch_fetch(293660);
    */


    $( '#watu_discover_movies' ).on( 'click', function(e) {
        e.preventDefault();
        var start = $('#movie-disc-start').val();
        var end = $('#movie-disc-end').val();
        watu_discover_movie_ids(start, end);
    });

    function watu_call_tmdb_connect() {
        watu_fetch_existing_movie_ids();

        var tmdb    = $('#movie-submission-existing-ids').data('response');
        var matches = JSON.stringify(tmdb).match(/(?:"_watu_movie_tmdb_id_storage":)\[.*?([\d.]+).*?\]\,/);
        var parse   = [];

        if(matches != null) {
            var mids = matches[0].match(/\[.*?([\d.]+).*?\]/);
            var parse = JSON.parse(mids[0]);
        }

        var ids    = $( '#movie-submission-ids' ).val();
        var movids = JSON.parse("[" + ids + "]");

        movids.map(function(id) {
            if ($.inArray('' + id, parse) != -1)
            {
              console.log('movie exists: ' + id);
              watu_tmdb_connect(id, WATU_TMDB_ROOT_MOVIE, false, true);
              return false;
            } else {
              watu_tmdb_connect(id, WATU_TMDB_ROOT_MOVIE, true, false);
            }
        });
    }

    function watu_discover_movie_ids(page, end) {
        for(i = page; i < end; i++) {
            var settings = {
              "dataType": 'json',
              "async": false,
              "crossDomain": true,
              "url":  WATU_TMDB_ROOT_DISC + i,
              "method": "GET",
              "headers": {},
              "data": {},
              beforeSend : function(xhr) {

              },
              dataFilter : function(response, type) {
                  return response;
              },
              success : function(response) {
                  ids = [];
                  if(response.results.length > 0) {
                      response.results.map(function(gid, gname) {
                          ids.push(gid.id);
                      });
                  }

                  $('#movie-submission-ids').val(ids);
                  $('#movie-creation-form').trigger('submit');
                  $('#movie-submission-ids').val(' ');
                  console.log('disc: ' + i);
              },
              fail : function(response) {

              }
            }

        	$.ajax(settings).done(function(response) {

            });
        }
    }

    function watu_fetch_existing_movie_ids() {
        var settings = {
          "dataType": 'json',
          "async": false,
          "crossDomain": false,
          "url":  MOVIE_CREATOR.root + 'wp/v2/posts/' + MOVIE_STORAGE,
          "method": "GET",
          "headers": {},
          "data": {},
          beforeSend : function(xhr) {
              xhr.setRequestHeader( 'X-WP-Nonce', MOVIE_CREATOR.nonce );
          },
          dataFilter : function(response, type) {
              response = JSON.stringify(response);
              return response;
          },
          success : function(response) {
              $('#movie-submission-existing-ids').attr('data-response', response);
          },
          fail : function(response) {
              // console.log('movie creation failed');
          }
        }

    	$.ajax(settings).done(function(response) {
            // console.log('movie creation done');
        });
    }

    // not working:: look for watu_tmdb_connect
    async function watu_fetch_tmdb_response(id = '', query, create, update) {
      const response = await fetch(query + id + WATU_TMDB_ROOT_LANG + WATU_TMDB_ROOT_KEY)
      const data = await response.json()
      if(data.overview == null) data.overview = 'No overview found for this movie.';

      // remove adult film and old movies
      var release = data.release_date;
      var year = release.split("-");
      if (!(year[0] > 1900) || data.adult == true) {
        console.log('invalid movie');
        return;
      }

      var slug = watu__convert_to_slug(data.title + ' ' + year[0]);
      console.log(create, update);
      if(create == false || update == true) {
        // update the movie
        console.log(data.title);
        watu_update_movie(data.id, data.imdb, JSON.stringify(slug), data.overview, JSON.stringify(data));
        return;
      }

      // extract genres
      var genre = [];

      if(data.genres.length > 0) {
        data.genres.map(function(gid, gname) {
            genre.push(gid.id);
        });
      }

      //var genre = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];

      // production
      /*
      var cat = {28 : 30, 12 : 31, 16 : 32, 35 : 33, 80 : 34, 99 : 35, 18 : 36, 10751 : 37, 14 : 38,
      36 : 39, 27 : 40, 10402 : 41, 9648 : 42, 10749 : 43, 878 : 44, 10770 : 45, 53 : 46, 10752 : 47, 37 : 48};.
      */

      // local
      var cat = {28 : 5, 12 : 6, 16 : 7, 35 : 8, 80 : 9, 99 : 10, 18 : 11, 10751 : 12, 14 : 13,
      36 : 14, 27 : 15, 10402 : 16, 9648 : 17, 10749 : 18, 878 : 19, 10770 : 20, 53 : 21, 10752 : 22, 37 : 23};


      genre = watu_genre_to_cat_replace(genre, cat);

      // watu_create_movie
      watu_create_movie(
        data.id,
        data.title,
        data.overview,
        genre,
        data.imdb_id,
        data.backdrop_path,
        data.poster_path,
        JSON.stringify(slug),
        data
      )

      return data
    }

    function watu_tmdb_connect(id = '', query, create, update) {
        var settings = {
          "dataType": 'json',
          "async": false,
          "crossDomain": true,
          "url":  query + id + WATU_TMDB_ROOT_LANG + WATU_TMDB_ROOT_KEY,
          "method": "GET",
          "headers": {},
          "data": "{}",
          beforeSend : function(xhr, settings) {
            // console.log('movie tmdb response before:' );
          },
          success : function(response) {
            // console.log('movie tmdb response success:');

            if(response.overview == null) response.overview = 'No overview found for this movie.';

            // remove adult film and old movies
            var release = response.release_date;
            var year = release.split("-");
            if (!(year[0] > 1900) || response.adult == true) {
              console.log('invalid movie');
              return;
            }

            var slug = watu__convert_to_slug(response.title + ' ' + year[0]);
 
            if( create == false || update == true ) {
              // update the movie
              watu_update_movie( response.id, response.imdb, JSON.stringify(slug), response.overview, JSON.stringify( response ) );
              return;
            }

            // extract genres
            var genre = [];

            if(response.genres.length > 0) {
              response.genres.map(function(gid, gname) {
                  genre.push(gid.id);
              });
            }

            //var genre = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];

            // production
            var cat = {28 : 30, 12 : 31, 16 : 32, 35 : 33, 80 : 34, 99 : 35, 18 : 36, 10751 : 37, 14 : 38,
            36 : 39, 27 : 40, 10402 : 41, 9648 : 42, 10749 : 43, 878 : 44, 10770 : 45, 53 : 46, 10752 : 47, 37 : 48};


            /*
            // local
            var cat = {28 : 5, 12 : 6, 16 : 7, 35 : 8, 80 : 9, 99 : 10, 18 : 11, 10751 : 12, 14 : 13,
            36 : 14, 27 : 15, 10402 : 16, 9648 : 17, 10749 : 18, 878 : 19, 10770 : 20, 53 : 21, 10752 : 22, 37 : 23};
            */

            genre = watu_genre_to_cat_replace(genre, cat);

            // watu_create_movie
            watu_create_movie(
              response.id,
              response.title,
              response.overview,
              genre,
              response.imdb_id,
              response.backdrop_path,
              response.poster_path,
              JSON.stringify(slug),
              response
            );
          },
          fail : function(response) {
              // console.log('movie tmdb response fail');
          },
          done : function(response) {
              // console.log('movie tmdb response succeed');
          }
        }

        $.ajax(settings);
    }

    function watu__convert_to_slug(Text) {
        return Text
            .toLowerCase()
            .replace(/[^\w ]+/g,'')
            .replace(/ +/g,'-')
            ;
    }

    function watu_genre_to_cat_replace(genre, cat) {
        if($.isEmptyObject(genre)) {
          genre = [0];
          return;
        }

        var cat = cat;
        // temporary array.
        var genre = genre;

        // regex to globally, case-insensitively match words. Note that this simplistic
        // regex will treat punctuation like ' or - as word separators, so beware!
        var regex = new RegExp("\\b(" + genre.join("|") + ")\\b", "gi");

        // replacer function.
        var replacer = function(value) { return cat[value]; };
        var str = genre.join('|');

        // perform replacements.
        var genre = str.replace(regex, replacer);

        // convert str to array again
        genre = genre.split('|');

        result = genre.map(function (x) {
            return parseInt(x, 10);
        });

        return result;
    }

    function watu_update_movie(id, imdb, slug, overview, data) {
      var settings = {
        "dataType": 'json',
        "async": true,
        "crossDomain": false,
        "url":  MOVIE_CREATOR.ajax_url,
        "method": "POST",
        "headers": {},
        "data": {
            action: 'watu_update_movie',
            _watu_movie_tmdb_id: id,
            _watu_movie_imdb_id: data.imdb,
            _watu_movie_slug: slug,
            _watu_movie_overview: overview,
            _watu_movie_data: data
        },
        beforeSend : function(xhr) {
            xhr.setRequestHeader( 'X-WP-Nonce', MOVIE_CREATOR.nonce );
            // console.log('movie update before');
        },
        success : function(response) {
            console.log('movie updated');

        },
        fail : function(response) {
            // console.log('movie update failed');
        }
      }

      $.ajax(settings).done(function(response) {
          // console.log('movie update done');
      });
    }

    function watu_create_movie(id, title, overview, genre, imdb, backdrop, poster, slug, result) {
        var settings = {
          "dataType": 'json',
          "async": false,
          "crossDomain": false,
          "url":  MOVIE_CREATOR.root + 'wp/v2/movie',
          "method": "POST",
          "headers": {},
          "data": {
              title: title,
              content: JSON.stringify(result),
              categories: genre,
              slug: slug,
              excerpt: overview,
              status: 'publish'
          },
          beforeSend : function(xhr) {
              xhr.setRequestHeader( 'X-WP-Nonce', MOVIE_CREATOR.nonce );
              // console.log('movie creation before');
          },
          dataFilter: function(response, type) {
              //console.log('movie creation filter');
              return response;
          },
          success : function(response) {
              //console.log(response);
              console.log('movie creation started');
              data = JSON.parse(response.content.raw);
              console.log(data.id);
              watu_add_meta_data(response.id, data.id, data.imdb_id);
              if(data.poster_path != null) watu_add_poster(response.id, data.poster_path, data.title);
              if(data.backdrop_path != null) watu_add_backdrop(response.id, data.backdrop_path, data.title);
          },
          fail : function(response) {
              // console.log('movie creation failed');
          }
        }

  	  $.ajax(settings).done(function(response) {
          // console.log('movie creation done');
      });
    }


    function watu_add_meta_data(id, tmdb, imdb) {
        var settings = {
          "dataType": 'json',
          "async": true,
          "crossDomain": false,
          "url":  MOVIE_CREATOR.ajax_url,
          "method": "POST",
          "headers": {},
          "data": {
              action: 'watu_create_movie_meta',
              watu_movie_id: id,
              watu_movie_tmdb_id: tmdb,
              watu_movie_imdb_id: imdb
          },
          beforeSend : function(xhr) {
              xhr.setRequestHeader( 'X-WP-Nonce', MOVIE_CREATOR.nonce );
              // console.log('meta creation before');
          },
          success : function(response) {
              // console.log('meta creation success');
          },
          fail : function(response) {
              // console.log('meta creation failed');
          }
        }

    	$.ajax(settings);
    }


    function watu_add_poster(id, poster, title) {
        var settings = {
          "dataType": 'json',
          "async": true,
          "crossDomain": false,
          "url":  MOVIE_CREATOR.ajax_url,
          "method": "POST",
          "headers": {},
          "data": {
              action: 'watu_generate_poster_image',
              watu_movie_id: id,
              watu_movie_poster: poster,
              watu_movie_title: title
          },
          beforeSend : function(xhr) {
              xhr.setRequestHeader( 'X-WP-Nonce', MOVIE_CREATOR.nonce );
              // console.log('poster creation before');
          },
          success : function(response) {
              // console.log('poster creation success');
          },
          fail : function(response) {
              // console.log('poster creation failed');
          }
        }

    	$.ajax(settings);
    }

    function watu_add_backdrop(id, backdrop, title) {
        var settings = {
          "dataType": 'json',
          "async": true,
          "crossDomain": false,
          "url":  MOVIE_CREATOR.ajax_url,
          "method": "POST",
          "headers": {},
          "data": {
              action: 'watu_generate_backrop_image',
              watu_movie_id: id,
              watu_movie_backdrop: backdrop,
              watu_movie_title: title
          },
          beforeSend : function(xhr) {
              xhr.setRequestHeader( 'X-WP-Nonce', MOVIE_CREATOR.nonce );
              // console.log('poster creation before');
          },
          success : function(response) {
              // console.log('backdrop creation success');
          },
          fail : function(response) {
              // console.log('backdrop creation failed');
          }
        }

    	$.ajax(settings).done(function(response) {
          console.log('movie creation done');
      });
    }
});
