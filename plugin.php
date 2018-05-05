<?php
/**
	* Plugin Name: Movie Creator
*/

/**
 * Movie creator forms
 */
add_filter( 'the_content', function( $content ) {
	if ( is_page( 'create-movie' ) ) {
	//only show to logged in users who can edit posts
		if ( is_user_logged_in() && current_user_can( 'edit_posts' ) ) {
			ob_start();
			?>
			<form id="movie-creation-form">
				<?php $m_storage = post_exists( 'Watu Movie Storage' ); ?>
				<span class="movie-storage" data-id="<?php echo get_post( $m_storage )->ID; ?>"></span>
				<label for="movie-creation-form"><?php _e( 'Movies', 'watuwatch' ); ?></label>
				<textarea id="movie-submission-ids" name="movie-submission-ids" rows="7" cols="20"></textarea>
				<input type="text" id="movie-disc-start" name="movieStart" value="1"><input type="text" id="movie-disc-end" name="movieEnd" value="2">
				<div style="width: auto; height: 50px; background: black;" id="movie-submission-existing-ids"></div>
				<button id="watu_create_movies" type="submit" style="color: #fff; margin-top: 20px;"><?php esc_attr_e( 'Create Movies', 'watuwatch'); ?></button>
				<button id="watu_discover_movies"  type="submit" style="color: #fff; margin-top: 20px;"><?php esc_attr_e( 'Discover Movies', 'watuwatch'); ?></button>
			</form>
			<br />
			<br />
			<form id="people-creation-form">
				<?php $p_storage = post_exists( 'Watu People Storage' ); ?>
				<span class="people-storage" data-id="<?php echo get_post( $p_storage )->ID; ?>"></span>
				<label for="people-creation-form"><?php _e( 'People', 'watuwatch' ); ?></label>
				<textarea id="people-submission-ids" name="people-submission-ids"  rows="7" cols="20"></textarea>
				<input type="text" id="people-disc-start" name="peopleStart" value="1"><input type="text" id="people-disc-end" name="peopleEnd" value="2">
				<div id="people-submission-existing-ids" style="width: auto; height: 50px; background: black;"></div>
				<button id="watu_create_people" type="submit" style="color: #fff; margin-top: 20px;"><?php esc_attr_e( 'Create People', 'watuwatch'); ?></button>
				<button id="watu_discover_people"  type="submit" style="color: #fff; margin-top: 20px;"><?php esc_attr_e( 'Discover People', 'watuwatch'); ?></button>
			</form>
			<?php
				$content .= ob_get_clean();
		} else {
			$content .=  sprintf( '<a href="%1s">%2s</a>', esc_url( wp_login_url() ), __( 'Login Here', 'watuwatch' ) );
		}
	}

	return $content;
});

/**
 * Setup or localize javascript
 */
 add_action( 'wp_enqueue_scripts', function() {
 	if ( is_user_logged_in() && current_user_can( 'edit_posts' ) ) {

 		//load script
 		wp_enqueue_script( 'people-creator', plugin_dir_url( __FILE__ ) . '/js/people-creator.js', array( 'jquery' ) );

 		//localize data for script
 		wp_localize_script( 'people-creator', 'PEOPLE_CREATOR', array(
 				'ajax_url' => admin_url( 'admin-ajax.php' ),
 				'root' => esc_url_raw( rest_url() ),
 				'nonce' => wp_create_nonce( 'wp_rest' ),
 				'success' => __( 'New people registered!', 'watuwatch' ),
 				'failure' => __( 'Registration failed.', 'watuwatch' ),
 				'current_user_id' => get_current_user_id()
 			)
 		);

 		wp_enqueue_script( 'movie-creator', plugin_dir_url( __FILE__ ) . '/js/movie-creator.js', array( 'jquery' ) );

 		//localize data for script
 		wp_localize_script( 'movie-creator', 'MOVIE_CREATOR', array(
 				'ajax_url' => admin_url( 'admin-ajax.php' ),
 				'root' => esc_url_raw( rest_url() ),
 				'nonce' => wp_create_nonce( 'wp_rest' ),
 				'success' => __( 'New movie created!', 'watuwatch' ),
 				'failure' => __( 'Creation failed.', 'watuwatch' ),
 				'current_user_id' => get_current_user_id()
 			)
 		);
 	}
 });

/**
 * Create movie creator page
 */
function watu_add_movie_creator() {
	if ( ! is_admin() ) {
		require_once( ABSPATH . 'wp-admin/includes/post.php' );
	}

	if( ! empty( post_exists( 'Create Movie' ) ) )  return;

	$id = wp_insert_post( array(
		'post_title'    => wp_strip_all_tags( 'Create Movie' ),
		'post_content'  => 'Please dont delete this page. This is the Movies and People Creator.',
		'post_type'     => 'page',
		'post_status'   => 'private'
		)
	);
}

add_action( 'init', 'watu_add_movie_creator' );

/**
 * Create necessary movie pages
 */

function watu_create_movie_pages($wp_error) {
	if ( ! is_admin() ) {
   		require_once( ABSPATH . 'wp-admin/includes/post.php' );
	}

	if( empty( post_exists( 'Films' ) ) )  {
		$id1 = wp_insert_post( array(
			'post_title'    => wp_strip_all_tags( 'Films' ),
			'post_content'  => 'Test',
			'post_type'     => 'page',
			'post_status'   => 'publish'
			)
		);
	}

	if( empty( post_exists( 'Discover' ) ) )  {
		$id2 = wp_insert_post( array(
			'post_title'    => wp_strip_all_tags( 'Discover' ),
			'post_content'  => 'Test',
			'post_type'     => 'page',
			'post_status'   => 'publish'
			)
		);
	}

	if( empty( post_exists( 'People' ) ) )  {
		$id2 = wp_insert_post( array(
			'post_title'    => wp_strip_all_tags( 'People' ),
			'post_content'  => 'Test',
			'post_type'     => 'page',
			'post_status'   => 'publish'
			)
		);
	}

	return $wp_error;
}

add_action( 'init', 'watu_create_movie_pages' );

include_once('php/movie-creator.php');
include_once('php/people-creator.php');
