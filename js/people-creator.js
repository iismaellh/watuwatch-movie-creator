jQuery( document ).ready( function ( $ ) {
    const WATU_TMDB_ROOT          = "https://api.themoviedb.org/3";
    const WATU_TMDB_ROOT_KEY      = "&append_to_response=movie_credits,tv_credits,external_ids,images,latest,popular&api_key=f9cf4ece2f9aeccbe524aaa92a1515ae";
    const WATU_TMDB_ROOT_LANG     = "?language=en-US";
    const WATU_TMDB_ROOT_PEOPLE   = WATU_TMDB_ROOT + "/person/";
    const WATU_TMDB_ROOT_DISC     = WATU_TMDB_ROOT + "/person/popular?api_key=f9cf4ece2f9aeccbe524aaa92a1515ae&language=en-US&page=";


    const PEOPLE_STORAGE = $( '.people-storage' ).data( 'id' );

    $( '#people-creation-form' ).on( 'submit', function(e) {
        e.preventDefault();
        watu_call_tmdb_connect();
    });

    $( '#watu_discover_people' ).on( 'click', function(e) {
        e.preventDefault();
        var start = $('#people-disc-start').val();
        var end = $('#people-disc-end').val();
        watu_discover_people_ids(start, end);
    });

    function watu_call_tmdb_connect() {
        watu_fetch_existing_people_ids();

        var tmdb    = $('#people-submission-existing-ids').data('response');
        var matches = JSON.stringify(tmdb).match(/(?:"_watu_people_tmdb_id_storage":)\[.*?([\d.]+).*?\]\,/);
        var parse   = [];

        if(matches != null) {
            var mids = matches[0].match(/\[.*?([\d.]+).*?\]/);
            var parse = JSON.parse(mids[0]);
        }

        var ids    = $( '#people-submission-ids' ).val();
        var movids = JSON.parse("[" + ids + "]");

        movids.map(function(id) {
            // console.log('people id:' + id);
            // check if people id exist
            if ($.inArray('' + id, parse) != -1)
            {
              console.log('people exists');
              // update peoples
              watu_tmdb_connect(id, WATU_TMDB_ROOT_PEOPLE, false, true);
              return;
            } else {
              watu_tmdb_connect(id, WATU_TMDB_ROOT_PEOPLE, true, false);
            }
        });
    }

    function watu_fetch_existing_people_ids() {
        var settings = {
          "dataType": 'json',
          "async": false,
          "crossDomain": false,
          "url":  PEOPLE_CREATOR.root + 'wp/v2/posts/' + PEOPLE_STORAGE,
          "method": "GET",
          "headers": {},
          "data": {},
          beforeSend : function(xhr) {
              xhr.setRequestHeader( 'X-WP-Nonce', PEOPLE_CREATOR.nonce );
          },
          dataFilter : function(response, type) {
              response = JSON.stringify(response);
              return response;
          },
          success : function(response) {
              $('#people-submission-existing-ids').attr('data-response', response);
          },
          fail : function(response) {
              // console.log('people creation failed');
          }
        }

    	$.ajax(settings).done(function(response) {
            // console.log('people creation done');
        });
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
            // console.log('people tmdb response before:' );
          },
          success : function(response) {
            // console.log('people tmdb response success:');
            // console.log(response);

            if(response.biography == null || response.biography == "") response.biography = "Biography not found.";

            if(create == false || update == true) {
              // update the movie
              watu_update_people(response.id, response.imdb_id, response.biography, JSON.stringify(response));
              return;
            };

            // watu_create_people returns id, name, bio, result
            watu_create_people(
              response.id,
              response.name,
              response.biography,
              response
            );
          },
          fail : function(response) {
              // console.log('people tmdb response fail');
          },
          done : function(response) {
              // console.log('people tmdb response succeed');
          }
        }

        $.ajax(settings);
    }

    function watu_discover_people_ids(page, end) {
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
                  //response = JSON.stringify(response);
                  return response;
              },
              success : function(response) {
                  //console.log(response.results);
                  ids = [];
                  if(response.results.length > 0) {
                      response.results.map(function(gid, gname) {
                          ids.push(gid.id);
                      });
                  }

                  $('#people-submission-ids').val(ids);
                  $('#people-creation-form').trigger('submit');
                  $('#people-submission-ids').val(' ');
                  console.log('disc: ' + i);
              },
              fail : function(response) {
                  // console.log('movie creation failed');
              }
            }

        	$.ajax(settings).done(function(response) {
                // console.log('movie creation done');
            });
        }
    }

    function watu_update_people(id, imdb, bio, data) {
      var settings = {
        "dataType": 'json',
        "async": true,
        "crossDomain": false,
        "url":  PEOPLE_CREATOR.ajax_url,
        "method": "POST",
        "headers": {},
        "data": {
            action: 'watu_update_people',
            watu_people_tmdb_id: id,
            watu_people_data: data,
            watu_people_imdb_id: imdb,
            watu_people_bio : bio
        },
        beforeSend : function(xhr) {
            xhr.setRequestHeader( 'X-WP-Nonce', PEOPLE_CREATOR.nonce );
            // console.log('people update before');
        },
        success : function(response) {
            console.log('people updated');

        },
        fail : function(response) {
            // console.log('people update failed');
        }
      }

      $.ajax(settings).done(function(response) {
          // console.log('people update done');
      });
    }

    function watu_create_people(id, name, bio, result) {
        var settings = {
          "dataType": 'json',
          "async": false,
          "crossDomain": false,
          "url":  PEOPLE_CREATOR.root + 'wp/v2/person',
          "method": "POST",
          "headers": {},
          "data": {
              title: name,
              content: JSON.stringify(result),
              excerpt: bio,
              status: 'publish'
          },
          beforeSend : function(xhr) {
              xhr.setRequestHeader( 'X-WP-Nonce', PEOPLE_CREATOR.nonce );
              // console.log('people creation before');
          },
          success : function(response) {
              console.log('people creation started: ', response.title.raw);
              data = JSON.parse(response.content.raw);
              watu_add_people_gender(response.id, data.gender);
              watu_create_people_meta(response.id, data.id, data.imdb_id);
              if(data.profile_path != null) watu_generate_profile_image(response.id, data.profile_path, data.name);
          },
          fail : function(response) {
              // console.log('people creation failed');
          }
        }

  	  $.ajax(settings).done(function(response) {
          // console.log('people creation done');
      });
    }

    function watu_add_people_gender(postid, gender) {
      var settings = {
        "dataType": 'json',
        "async": true,
        "crossDomain": false,
        "url":  PEOPLE_CREATOR.ajax_url,
        "method": "GET",
        "headers": {},
        "data": {
            action: 'watu_add_people_gender',
            watu_people_id: postid,
            watu_people_gender: gender
        },
        beforeSend : function(xhr) {
            xhr.setRequestHeader( 'X-WP-Nonce', PEOPLE_CREATOR.nonce );
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


    function watu_create_people_meta(postid, tmdb, imdb) {
      var settings = {
        "dataType": 'json',
        "async": true,
        "crossDomain": false,
        "url":  PEOPLE_CREATOR.ajax_url,
        "method": "GET",
        "headers": {},
        "data": {
            action: 'watu_create_people_meta',
            watu_people_id: postid,
            watu_people_tmdb_id: tmdb,
            watu_people_imdb_id: imdb
        },
        beforeSend : function(xhr) {
            xhr.setRequestHeader( 'X-WP-Nonce', PEOPLE_CREATOR.nonce );
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


    function watu_generate_profile_image(postid, profile, title) {
        var settings = {
          "dataType": 'json',
          "async": true,
          "crossDomain": false,
          "url":  PEOPLE_CREATOR.ajax_url,
          "method": "GET",
          "headers": {},
          "data": {
              action: 'watu_generate_profile_image',
              watu_people_id: postid,
              watu_people_profile: profile,
              watu_people_title: title
          },
          beforeSend : function(xhr) {
              xhr.setRequestHeader( 'X-WP-Nonce', PEOPLE_CREATOR.nonce );
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
});
