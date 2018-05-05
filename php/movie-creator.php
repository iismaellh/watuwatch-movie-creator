<?php

require_once( ABSPATH . 'wp-admin/includes/post.php' );

$storage = post_exists( 'Watu Movie Storage' );
define( MOVIE_STORAGE, get_post( $storage )->ID );

/**
 * Create the movie id storage
 */

function watu_create_movie_storage() {
	if ( ! is_admin() ) {
    	require_once( ABSPATH . 'wp-admin/includes/post.php' );
	}

	if( metadata_exists( 'post', MOVIE_STORAGE, '_watu_movie_tmdb_id_storage' ) == false ) add_post_meta( MOVIE_STORAGE, '_watu_movie_tmdb_id_storage', array( 50 ) );

	if( ! empty( post_exists( 'Watu Movie Storage' ) ) )  return;

	$id = wp_insert_post( array(
		'post_title'    => wp_strip_all_tags( 'Watu Movie Storage' ),
		'post_content'  => 'Please dont delete this post. This is use to store movie IDs',
		'post_status'   => 'private'
		)
	);
}

add_action( 'init', 'watu_create_movie_storage' );


/**
 * Check if the _watu_movie_tmdb_id meta info exist
 * 
 * @return bool
 */

function watu_check_movie_meta() {
	if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
		if( metadata_exists('post', $_REQUEST['watu_movie_id'], '_watu_movie_tmdb_id')) return true;
		die();
	}
}

/**
 * Update the movie content if it exists
 */

add_action( 'wp_ajax_nopriv_watu_update_movie', 'watu_update_movie');
add_action( 'wp_ajax_watu_update_movie', 'watu_update_movie');

function watu_update_movie() {
	if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
		global $wpdb;

		$tmdb = $_REQUEST['_watu_movie_tmdb_id'];
		$imdb = $_REQUEST['_watu_movie_imdb_id'];

		$postid = $wpdb->get_col(
			"
			SELECT ID
			FROM $wpdb->posts
			WHERE post_tmdb = $tmdb
				AND post_type = 'movie'
			"
		);

		$wpdb->update( $wpdb->posts, array( 'post_tmdb' => $_REQUEST['_watu_movie_tmdb_id'], 'post_imdb' => $_REQUEST['_watu_movie_imdb_id'] ), array( 'ID' => $postid, 'post_type' => 'movie' ), array( '%d', '%s' ), array( '%d', '%s' ) );

		$movie = array(
			'ID'           => $postid,
			'post_excerpt' => $_REQUEST['_watu_movie_overview'],
			'post_content' => $_REQUEST['_watu_movie_data'],
			'post_name'    => $_REQUEST['_watu_movie_slug'],
		);

	  	wp_update_post( $movie );
		die();
	}
}

/**
 * Create the movie meta and insert movies to a storage
 */

add_action( 'wp_ajax_nopriv_watu_create_movie_meta', 'watu_create_movie_meta');
add_action( 'wp_ajax_watu_create_movie_meta', 'watu_create_movie_meta');

function watu_create_movie_meta() {
	if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
		global $wpdb;

		$wpdb->update( $wpdb->posts, array( 'post_tmdb' => $_REQUEST['watu_movie_tmdb_id'], 'post_imdb' => $_REQUEST['watu_movie_imdb_id'] ), array( 'ID' => $_REQUEST['watu_movie_id'], 'post_type' => 'movie' ), array( '%d', '%s' ), array( '%d', '%s' ) );

		// move all created movie ids in a meta data
		$storage = array();
		$ids = get_post_meta( MOVIE_STORAGE, '_watu_movie_tmdb_id_storage', true );
		if( in_array( $_REQUEST['watu_movie_tmdb_id'], $ids ) ) exit();
		array_push( $storage, $_REQUEST['watu_movie_tmdb_id'] );
		$result = array_merge( $storage, $ids );
		update_post_meta( MOVIE_STORAGE, '_watu_movie_tmdb_id_storage', $result, $ids );
		die();
	}
}

/**
 * Regiter movie storage field to the api endpoint
 */

add_action( 'rest_api_init', 'watu_movie_tmdb_id_storage' );
function watu_movie_tmdb_id_storage() {
    register_rest_field( 'post',
        '_watu_movie_tmdb_id_storage',
        array(
            'get_callback'    => 'watu_movie_get_tmdb_id_storage',
            'update_callback' => null,
            'schema'          => null,
        )
    );
}

/**
 * Get the value of the "movie storage" field
 *
 * @param array $object Details of current post.
 * @param string $field_name Name of field.
 * @param WP_REST_Request $request Current request
 *
 * @return mixed
 */
function watu_movie_get_tmdb_id_storage( $object, $field_name, $request ) {
    return get_post_meta( $object[ 'id' ], $field_name, true );
}

add_action( 'wp_ajax_nopriv_watu_generate_poster_image', 'watu_generate_poster_image');
add_action( 'wp_ajax_watu_generate_poster_image', 'watu_generate_poster_image');

/**
* Downloads the movie poster image 
*
* @param string watu_movie_poster   The URL of the image to download.
* @param int    watu_movie_id The post ID the post thumbnail is to be associated with.
*
* @return string|WP_Error Attachment ID, WP_Error object otherwise.
*/
function watu_generate_poster_image() {
	if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
		// require these files
		if ( !function_exists('media_handle_sideload') ) {
			require_once(ABSPATH . "wp-admin" . '/includes/image.php');
			require_once(ABSPATH . "wp-admin" . '/includes/file.php');
			require_once(ABSPATH . "wp-admin" . '/includes/media.php');
		}

		$file = $_REQUEST['watu_movie_poster'];
		$post_id = $_REQUEST['watu_movie_id'];
		$title = wp_strip_all_tags($_REQUEST['watu_movie_title'] . ' %Poster%');

    $file_array = array();
    $file_array['name'] = basename( 'https://image.tmdb.org/t/p/w780' . $file);

    // Download file to temp location.
    $file_array['tmp_name'] = download_url( 'https://image.tmdb.org/t/p/w780' . $file );

    // If error storing temporarily, return the error.
    if ( is_wp_error( $file_array['tmp_name'] ) ) {
        return $file_array['tmp_name'];
    }

    // Do the validation and storage stuff.
    $id = media_handle_sideload( $file_array, $post_id, $title );

		@unlink( $file_array['tmp_name'] );
    // If error storing permanently, unlink.
    if ( is_wp_error( $id ) ) {
			  @unlink( $file_array['tmp_name'] );
        return $id;
    }

		update_post_meta($id, '_wp_attachment_image_alt', $title);
    return set_post_thumbnail( $post_id, $id );

		die();
	}
}

/**
* Downloads the movie backdrop image 
*
* @param string watu_movie_backdrop  The URL of the image to download.
* @param int    watu_movie_id The post ID the post thumbnail is to be associated with.
*
* @return string|WP_Error Attachment ID, WP_Error object otherwise.
*/

add_action( 'wp_ajax_nopriv_watu_generate_backrop_image', 'watu_generate_backrop_image');
add_action( 'wp_ajax_watu_generate_backrop_image', 'watu_generate_backrop_image');

function watu_generate_backrop_image() {
		// require these files
		if ( !function_exists('media_handle_sideload') ) {
			require_once(ABSPATH . "wp-admin" . '/includes/image.php');
			require_once(ABSPATH . "wp-admin" . '/includes/file.php');
			require_once(ABSPATH . "wp-admin" . '/includes/media.php');
		}

		$file = $_REQUEST['watu_movie_backdrop'];
		$post_id = $_REQUEST['watu_movie_id'];
		$title = wp_strip_all_tags($_REQUEST['watu_movie_title'] . ' %Backdrop%');

		$file_array = array();
		$file_array['name'] = basename( 'https://image.tmdb.org/t/p/w1280' . $file );

    // Download file to temp location.
    $file_array['tmp_name'] = download_url( 'https://image.tmdb.org/t/p/w1280' . $file );

    // If error storing temporarily, return the error.
    if ( is_wp_error( $file_array['tmp_name'] ) ) {
        return $file_array['tmp_name'];
    }

    // Do the validation and storage stuff.
    $id = media_handle_sideload( $file_array, $post_id, $title );

		@unlink( $file_array['tmp_name'] );
    // If error storing permanently, unlink.
    if ( is_wp_error( $id ) ) {
			  @unlink( $file_array['tmp_name'] );
        return $id;
    }

	$url = wp_get_attachment_url($id);
	update_post_meta($post_id, '_watu_movie_backdrop_url', $url);
	update_post_meta($id, '_wp_attachment_image_alt', $title);
}

?>
