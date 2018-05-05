<?php

require_once( ABSPATH . 'wp-admin/includes/post.php' );

$storage = post_exists( 'Watu People Storage' );
define( PEOPLE_STORAGE, get_post( $storage )->ID );

function watu_create_people_storage() {
	if ( ! is_admin() ) {
    require_once( ABSPATH . 'wp-admin/includes/post.php' );
	}

	if( metadata_exists( 'post', PEOPLE_STORAGE, '_watu_people_tmdb_id_storage' ) == false ) add_post_meta( PEOPLE_STORAGE, '_watu_people_tmdb_id_storage', array( 50 ) );

	if( ! empty( post_exists( 'Watu People Storage' ) ) )  return;

	$id = wp_insert_post( array(
		'post_title'    => wp_strip_all_tags( 'Watu People Storage' ),
		'post_content'  => 'Please dont delete this post. This is use to store person IDs',
		'post_status'   => 'private'
		)
	);
}

add_action( 'init', 'watu_create_people_storage' );

function watu_check_people_meta() {
	if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
		if( metadata_exists('post', $_REQUEST['watu_people_id'], '_watu_people_tmdb_id')) return true;
		die();
	}
}

add_action( 'wp_ajax_nopriv_watu_update_people', 'watu_update_people');
add_action( 'wp_ajax_watu_update_people', 'watu_update_people');

function watu_update_people() {
	if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
		global $wpdb;

		$tmdb = $_REQUEST['_watu_movie_tmdb_id'];
		$imdb = $_REQUEST['_watu_movie_imdb_id'];

		$postid = $wpdb->get_col(
			"
			SELECT ID
			FROM $wpdb->posts
			WHERE post_tmdb = $tmdb
				AND post_type = 'person'
			"
		);

		$wpdb->update( $wpdb->posts, array( 'post_tmdb' => $_REQUEST['_watu_movie_tmdb_id'], 'post_imdb' => $_REQUEST['_watu_movie_imdb_id'] ), array( 'ID' => $postid, 'post_type' => 'person' ), array( '%d', '%s' ), array( '%d', '%s' ) );

	  $people = array(
	      'ID'           => $postid,
	      'post_content' => $_REQUEST['_watu_people_data'],
        'post_excerpt' => $_REQUEST['_watu_people_bio']
	  );

	  wp_update_post( $people );
		die();
	}
}

add_action( 'wp_ajax_nopriv_watu_create_people_meta', 'watu_create_people_meta');
add_action( 'wp_ajax_watu_create_people_meta', 'watu_create_people_meta');
function watu_create_people_meta() {
	if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
		global $wpdb;

		$wpdb->update( $wpdb->posts, array( 'post_tmdb' => $_REQUEST['watu_people_tmdb_id'], 'post_imdb' => $_REQUEST['watu_people_imdb_id'] ), array( 'ID' => $_REQUEST['watu_people_id'], 'post_type' => 'person' ), array( '%d', '%s' ), array( '%d', '%s' ) );

		// move all created people ids in a meta data
		$storage = array();
		$ids = get_post_meta( PEOPLE_STORAGE, '_watu_people_tmdb_id_storage', true );
		if( in_array( $_REQUEST['watu_people_tmdb_id'], $ids ) ) exit();
		array_push( $storage, $_REQUEST['watu_people_tmdb_id'] );
		$result = array_merge( $storage, $ids );
		update_post_meta( PEOPLE_STORAGE, '_watu_people_tmdb_id_storage', $result, $ids );
		die();
	}
}

add_action( 'wp_ajax_nopriv_watu_add_people_gender', 'watu_add_people_gender');
add_action( 'wp_ajax_watu_add_people_gender', 'watu_add_people_gender');

function watu_add_people_gender() {
	if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
      $gender = $_REQUEST['watu_people_gender'] == 1 ? 2 : 3;
			wp_set_object_terms( $_REQUEST['watu_people_id'], $gender, 'genders', false );
		die();
	}
}

add_action( 'rest_api_init', 'watu_people_tmdb_id_storage' );
function watu_people_tmdb_id_storage() {
    register_rest_field( 'post',
        '_watu_people_tmdb_id_storage',
        array(
            'get_callback'    => 'watu_get_people_tmdb_id_storage',
            'update_callback' => null,
            'schema'          => null,
        )
    );
}

/**
 * Get the value of the "starship" field
 *
 * @param array $object Details of current post.
 * @param string $field_name Name of field.
 * @param WP_REST_Request $request Current request
 *
 * @return mixed
 */
function watu_get_people_tmdb_id_storage( $object, $field_name, $request ) {
    return get_post_meta( $object[ 'id' ], $field_name, true );
}

add_action( 'wp_ajax_nopriv_watu_generate_profile_image', 'watu_generate_profile_image');
add_action( 'wp_ajax_watu_generate_profile_image', 'watu_generate_profile_image');

/**
* Downloads an image from the specified URL and attaches it to a post as a post thumbnail.
*
* @param string $file    The URL of the image to download.
* @param int    $post_id The post ID the post thumbnail is to be associated with.
* @param string $desc    Optional. Description of the image.
* @return string|WP_Error Attachment ID, WP_Error object otherwise.
*/
function watu_generate_profile_image() {
	if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
		// require these files
		if ( !function_exists('media_handle_sideload') ) {
			require_once(ABSPATH . "wp-admin" . '/includes/image.php');
			require_once(ABSPATH . "wp-admin" . '/includes/file.php');
			require_once(ABSPATH . "wp-admin" . '/includes/media.php');
		}

		$file = $_REQUEST['watu_people_profile'];
		$post_id = $_REQUEST['watu_people_id'];
		$title = wp_strip_all_tags($_REQUEST['watu_people_title'] . ' Poster');

    $file_array = array();
    $file_array['name'] = basename( 'https://image.tmdb.org/t/p/h632' . $file);

    // Download file to temp location.
    $file_array['tmp_name'] = download_url( 'https://image.tmdb.org/t/p/h632' . $file );

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

?>
