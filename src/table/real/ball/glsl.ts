import { BOXES, LAMPS } from './lamps'

// What every surface of the ball shares: the lamps as the ball sees them, the soft light from above, the dark surround.
export const head = /* glsl */ `
#define LAMPS ${LAMPS}
#define BOXES ${BOXES}
#define SOFT 9.0
uniform vec3 uEye;
uniform vec3 uSoft;
uniform vec3 uSoftDir;
uniform vec3 uHaze;
uniform vec3 uFloor;
uniform vec3 uGround;
uniform vec3 uLampPos[ LAMPS ];
uniform vec4 uLampCol[ LAMPS ];
uniform vec3 uLampLit[ LAMPS ];
uniform float uR;

vec3 softbox( vec3 d, float blur ) {
	vec3 s = normalize( uSoftDir );
	vec3 a = normalize( cross( vec3( 0.0, 0.0, 1.0 ), s ) );
	vec3 b = cross( s, a );
	float f = dot( d, s );
	if ( f <= 0.02 ) return vec3( 0.0 );
	float x = dot( d, a ) / f;
	float y = dot( d, b ) / f;
	float e = 0.03 + blur;
	float m = ( 1.0 - smoothstep( 0.46 - e, 0.46 + e, abs( x ) ) ) * ( 1.0 - smoothstep( 0.29 - e, 0.29 + e, abs( y ) ) );
	float bar = smoothstep( 0.018, 0.045 + blur, abs( x + 0.08 ) );
	return uSoft * m * ( 0.25 + 0.75 * bar ) * ( 0.7 + 0.6 * smoothstep( - 0.29, 0.29, y ) );
}

// The one window of the room on the ball: a soft pane bent round the wall, on the side of the soft light as the eye sees it, cut by one bar. It stands at a set share of the radius, so it never lies over the middle.
vec3 pane( vec3 Np, float rho, vec3 V, float side, float at, float deep, float wide, float blur ) {
	vec3 S = normalize( uSoftDir );
	vec3 U = normalize( S - V * dot( S, V ) + vec3( 1e-4, 2e-4, 0.0 ) ) * side;
	float along = atan( dot( cross( U, Np ), V ), dot( U, Np ) );
	float e = 0.012 + blur;
	float m = ( 1.0 - smoothstep( deep - e, deep + e, abs( rho - at ) ) ) * ( 1.0 - smoothstep( wide - e * 3.0, wide + e * 3.0, abs( along ) ) );
	float bar = smoothstep( 0.012, 0.03 + blur, abs( along + 0.07 ) );
	return uSoft * m * ( 0.3 + 0.7 * bar ) * ( 0.7 + 0.6 * smoothstep( - deep, deep, rho - at ) );
}

vec3 surround( vec3 d ) {
	float haze = exp( - abs( d.z ) * 5.5 );
	return uHaze * ( 0.3 + haze ) + uFloor * uGround * 0.5 * smoothstep( 0.05, - 0.7, d.z );
}

vec3 lampsIn( vec3 r, vec3 p, float wide ) {
	vec3 c = vec3( 0.0 );
	for ( int i = 0; i < LAMPS; i ++ ) {
		vec3 to = uLampPos[ i ] - p;
		float dist = length( to );
		float size = clamp( 15.0 / dist, 0.045, 0.15 ) * wide;
		float k = 2.0 * ( 1.0 - dot( r, to / dist ) );
		c += uLampCol[ i ].rgb * ( 1.0 - uLampCol[ i ].w ) * exp( - k / ( size * size ) );
	}
	return c;
}
vec3 lampsBack( vec3 r, vec3 p ) {
	vec3 c = vec3( 0.0 );
	for ( int i = 0; i < LAMPS; i ++ ) {
		vec3 to = uLampPos[ i ] - p;
		float dist = length( to );
		float near = clamp( 15.0 / dist, 0.045, 0.15 );
		float size = near * 1.4;
		float k = 2.0 * ( 1.0 - dot( r, to / dist ) );
		float spread = min( 1.0, 0.0049 / ( near * near ) );
		c += uLampCol[ i ].rgb * ( 1.0 - uLampCol[ i ].w ) * exp( - k / ( size * size ) ) * spread;
	}
	return c;
}
`

export const shellVertex = /* glsl */ `
attribute float aHalf;
attribute float aKind;
uniform mat4 uToPage;
uniform float uOpen;
uniform vec4 uPress;
varying vec3 vO;
varying vec3 vP;
varying vec3 vN;
varying vec3 vAxisY;
varying vec3 vAxisZ;
varying float vKind;
varying vec2 vUv;
varying vec3 vView;
varying vec3 vMid;
varying float vRw;
void main() {
	vec3 p = position;
	vec3 n = normal;
	if ( uOpen > 0.0 ) {
		float a = - aHalf * uOpen * 1.2;
		float c = cos( a );
		float s = sin( a );
		vec3 q = p - vec3( 0.0, 0.0, - 1.0 );
		q = vec3( q.x, c * q.y - s * q.z, s * q.y + c * q.z );
		p = q + vec3( 0.0, aHalf * uOpen * 0.3, - 1.0 );
		n = vec3( n.x, c * n.y - s * n.z, s * n.y + c * n.z );
	}
	if ( uPress.w > 0.0 ) {
		float along = dot( p, uPress.xyz );
		float over = along - ( 1.0 - uPress.w );
		p += ( p - uPress.xyz * along ) * uPress.w * 0.3 * smoothstep( - 0.3, 1.0, along );
		if ( over > 0.0 ) {
			p -= uPress.xyz * over;
			n = normalize( mix( n, uPress.xyz, smoothstep( 0.0, 0.03, over ) ) );
		}
	}
	mat3 m = mat3( uToPage ) * mat3( modelMatrix );
	vec4 wp = modelMatrix * vec4( p, 1.0 );
	vO = position;
	vP = ( uToPage * wp ).xyz;
	vN = normalize( m * n );
	vAxisY = normalize( m * vec3( 0.0, 1.0, 0.0 ) );
	vAxisZ = normalize( m * vec3( 0.0, 0.0, 1.0 ) );
	vKind = aKind;
	vUv = uv;
	vView = ( viewMatrix * wp ).xyz;
	vMid = ( viewMatrix * modelMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz;
	vRw = length( modelMatrix[ 0 ].xyz );
	gl_Position = projectionMatrix * viewMatrix * wp;
	if ( aKind > 0.5 && aKind < 1.5 && uOpen < 0.002 ) gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
}
`

const shared = /* glsl */ `
uniform sampler2D uArt;
uniform float uArtOn;
uniform vec2 uBallUv;
uniform vec4 uFlat;
uniform vec4 uBoxAt[ BOXES ];
uniform vec4 uBoxCol[ BOXES ];
uniform vec3 uFlatCol;
uniform vec4 uDoor;
uniform vec3 uDoorLit;
uniform float uDrop;
uniform float uTrue;
uniform float uPlugTurn;
uniform float uOpen;
uniform float uBend;
varying vec3 vO;
varying vec3 vP;
varying vec3 vN;
varying vec3 vAxisY;
varying vec3 vAxisZ;
varying float vKind;
varying vec2 vUv;
#define RIN 0.875
#define IOR 1.49

vec3 seat( vec3 n, vec3 v, float under ) {
	float r = length( vUv );
	if ( r > 1.0 ) discard;
	float cs = cos( uPlugTurn );
	float sn = sin( uPlugTurn );
	vec2 q = vec2( cs * vUv.x - sn * vUv.y, sn * vUv.x + cs * vUv.y );
	float slot = ( 1.0 - smoothstep( 0.1, 0.15, abs( q.y ) ) ) * ( 1.0 - smoothstep( 0.6, 0.66, abs( q.x ) ) );
	float gap = smoothstep( 0.9, 0.95, r );
	float chamfer = smoothstep( 0.68, 0.76, r ) * ( 1.0 - gap );
	float rings = sin( r * 64.0 );
	vec3 out3 = ( vUv.x * vAxisZ + vUv.y * vAxisY ) / max( r, 0.001 );
	vec3 nn = normalize( n + out3 * ( chamfer * 0.55 + rings * 0.07 * ( 1.0 - slot ) ) );
	vec3 rm = reflect( - v, nn );
	vec3 metal = vec3( 0.8, 0.82, 0.86 );
	vec3 c = metal * ( surround( rm ) * 2.0 + softbox( rm, 0.5 ) * SOFT * 0.2 + lampsIn( rm, vP, 3.2 ) * 0.06 + uSoft * 0.75 * ( 0.45 + 0.55 * max( dot( nn, normalize( uSoftDir ) ), 0.0 ) ) + uHaze * 3.0 );
	c *= mix( 1.0, 0.22, slot );
	c *= mix( 1.0, 0.12, gap );
	return c * under;
}

vec3 cut( vec3 n ) {
	vec3 c = uHaze * 3.0 + uSoft * 0.22 * ( 0.4 + 0.6 * max( dot( n, normalize( uSoftDir ) ), 0.0 ) );
	for ( int i = 0; i < LAMPS; i ++ ) c += uLampLit[ i ] * 0.12 * max( dot( n, normalize( uLampPos[ i ] - vP ) ), 0.0 );
	return c;
}

vec4 floorAt( vec3 from, vec3 dir ) {
	vec3 d = dir + step( abs( dir ), vec3( 1e-4 ) ) * 1e-4;
	float tFloor = d.z < - 0.02 ? ( uDrop - from.z ) / d.z : 1e6;
	float best = 1e6;
	vec3 wall = vec3( 0.0 );
	float tall = 1.0;
	float face = 0.0;
	for ( int i = 0; i < BOXES; i ++ ) {
		float h = uBoxCol[ i ].w;
		if ( h <= 0.0 ) continue;
		vec3 a = ( vec3( uBoxAt[ i ].xy - uBoxAt[ i ].zw, uDrop ) - from ) / d;
		vec3 b = ( vec3( uBoxAt[ i ].xy + uBoxAt[ i ].zw, uDrop + h ) - from ) / d;
		vec3 tn = min( a, b );
		vec3 tf = max( a, b );
		float n = max( max( tn.x, tn.y ), tn.z );
		float f = min( min( tf.x, tf.y ), tf.z );
		if ( n < f && n > 0.0 && n < best ) {
			best = n;
			wall = uBoxCol[ i ].rgb;
			tall = h;
			face = tn.z >= max( tn.x, tn.y ) ? 2.0 : ( tn.x > tn.y ? 0.0 : 1.0 );
		}
	}
	if ( best < tFloor ) {
		vec3 p = from + d * best;
		float up = clamp( ( p.z - uDrop ) / tall, 0.0, 1.0 );
		float along = face < 0.5 ? p.y : p.x;
		float bars = smoothstep( 0.07, 0.13, abs( fract( along / ( uR * 1.3 ) ) - 0.5 ) );
		float rows = smoothstep( 0.03, 0.07, abs( fract( ( p.z - uDrop ) / ( uR * 2.4 ) ) - 0.5 ) );
		float foot = smoothstep( 0.0, uR * 0.5, p.z - uDrop );
		float side = face > 1.5 ? 1.1 : ( face < 0.5 ? 0.78 : 1.0 ) * mix( 0.34, 1.0, bars * rows ) * mix( 0.5, 1.12, up ) * mix( 0.45, 1.0, foot );
		float seenWall = 1.0 - smoothstep( uR * 12.0, uR * 24.0, best );
		if ( uDoor.z > 0.5 && face > 0.5 && face < 1.5 && abs( p.y - uDoor.y ) < uR * 1.4 ) {
			float sx = p.x - uDoor.x;
			float dx = abs( sx );
			float hz = p.z - uDrop;
			vec3 c = mix( vec3( 0.107, 0.117, 0.125 ), vec3( 0.065, 0.120, 0.125 ), smoothstep( 0.08, 0.12, abs( fract( p.x / 62.0 ) - 0.5 ) ) ) * uDoorLit;
			if ( hz > 153.6 ) c = vec3( 0.202, 0.205, 0.209 ) * uDoorLit * ( hz < 206.4 ? 1.0 : 0.7 );
			else if ( hz > 144.0 && dx < 108.2 ) c = vec3( 0.254, 0.144, 0.025 ) * mix( 0.16, 0.8, ( hz - 144.0 ) / 9.6 ) * uDoorLit;
			else if ( dx < 108.2 ) {
				float hj = hz / 144.0;
				c = ( sx > 0.0 ? vec3( 0.188, 0.098, 0.019 ) : vec3( 0.220, 0.153, 0.070 ) ) * uDoorLit * ( hj < 0.58 ? mix( 0.3, 1.5, smoothstep( 0.0, 0.58, hj ) ) : mix( 1.5, 0.35, smoothstep( 0.58, 1.0, hj ) ) );
			}
			if ( dx < 91.2 && hz < 144.0 ) {
				vec3 room = vec3( 0.108, 0.089, 0.057 ) * ( hz < 35.0 ? 0.6 : ( hz < 70.0 ? 1.0 : 1.5 ) );
				room = mix( room, vec3( 0.356, 0.285, 0.164 ), smoothstep( 90.0, 104.0, hz ) );
				room = mix( room, vec3( 0.871, 0.831, 0.745 ), smoothstep( 104.0, 110.0, hz ) * step( abs( fract( dx / 26.0 ) - 0.5 ), 0.28 ) * step( abs( fract( hz / 12.0 ) - 0.5 ), 0.3 ) );
				c = room;
				float open = 91.2 * ( 1.0 - uDoor.w );
				if ( dx > open ) {
					float l = ( dx - open ) / max( uDoor.w, 0.05 );
					float q = fract( ( l + hz * 0.55 ) / 91.2 );
					c += vec3( 0.03, 0.036, 0.037 ) * uDoorLit * ( 0.6 - 0.6 * smoothstep( 0.0, 0.03, abs( q - 0.3 ) ) + 0.4 - 0.4 * smoothstep( 0.0, 0.015, abs( q - 0.42 ) ) );
					if ( l < 3.0 || l > 85.2 ) c = vec3( 0.503, 0.262, 0.058 ) * uDoorLit;
					if ( hz >= 137.0 ) c = vec3( 0.296, 0.144, 0.022 ) * uDoorLit;
					if ( hz < 24.0 ) c = vec3( 0.252, 0.122, 0.019 ) * uDoorLit;
				}
			}
			return vec4( mix( surround( dir ), c, seenWall ), seenWall );
		}
		return vec4( mix( surround( dir ), wall * side, seenWall ), seenWall );
	}
	if ( d.z > - 0.04 ) return vec4( surround( dir ) + softbox( dir, 0.1 ) * 0.6, 0.0 );
	vec2 hit = from.xy + d.xy * tFloor;
	vec2 uv = uBallUv + hit / vec2( 1920.0, 1080.0 );
	vec3 art = mix( uGround, texture2D( uArt, uv ).rgb, uArtOn );
	float inside = mix( 1.0, step( abs( uv.x - 0.5 ), 0.5 ) * step( abs( uv.y - 0.5 ), 0.5 ), uArtOn );
	vec2 onFlat = step( abs( hit - uFlat.xy ), uFlat.zw );
	art = mix( art, uFlatCol, onFlat.x * onFlat.y );
	float fade = 1.0 - smoothstep( uR * 3.0, uR * 9.0, length( hit ) );
	vec3 glow = vec3( 0.0 );
	float bezel = 0.0;
	for ( int i = 0; i < LAMPS; i ++ ) {
		float q = length( hit - uLampPos[ i ].xy );
		float disc = 1.0 - smoothstep( 44.0, 50.0, q );
		bezel = max( bezel, uLampCol[ i ].w * smoothstep( 49.0, 52.0, q ) * ( 1.0 - smoothstep( 57.0, 60.0, q ) ) );
		vec2 on = hit - uLampPos[ i ].xy;
		float lens = ( 0.6 + 0.4 * sin( q * 0.95 ) ) * ( 0.82 + 0.18 * sin( atan( on.y, on.x ) * 18.0 ) );
		glow += uLampCol[ i ].rgb * uLampCol[ i ].w * ( disc * ( 0.2 + 1.15 * exp( - q * q / 1000.0 ) ) * lens + 0.1 * exp( - q * q / 9000.0 ) );
	}
	float shade = 1.0 - 0.45 * exp( - dot( hit, hit ) / ( uR * uR * 1.1 ) );
	float open = inside * fade;
	return vec4( mix( surround( dir ), art * uFloor * shade * ( 1.0 - 0.75 * bezel ) + glow, open ), open );
}


// The way of a ray of sight through the hollow wall: in at P on the outer wall, on through the air inside and out of the far wall, or thrown back by the inner wall where it meets it too flat.
void through( vec3 P, vec3 D, vec3 C, out vec3 from, out vec3 dir ) {
	float ri = RIN * uR;
	vec3 T1 = refract( D, normalize( P - C ), 1.0 / IOR );
	vec3 q = P - C;
	float b = dot( q, T1 );
	vec3 P2 = P + T1 * ( - b - sqrt( max( b * b - dot( q, q ) + ri * ri, 0.0 ) ) );
	vec3 N2 = normalize( P2 - C );
	vec3 T2 = refract( T1, N2, IOR );
	if ( dot( T2, T2 ) < 0.5 ) {
		vec3 Tr = reflect( T1, N2 );
		vec3 q2 = P2 - C;
		float b2 = dot( q2, Tr );
		vec3 P3 = P2 + Tr * ( - b2 + sqrt( max( b2 * b2 - dot( q2, q2 ) + uR * uR, 0.0 ) ) );
		vec3 N3 = normalize( P3 - C );
		vec3 To = refract( Tr, - N3, IOR );
		if ( dot( To, To ) < 0.5 ) To = reflect( Tr, - N3 );
		from = P3;
		dir = To;
		return;
	}
	vec3 P3 = P2 + T2 * ( - 2.0 * dot( P2 - C, T2 ) );
	vec3 T3 = refract( T2, - normalize( P3 - C ), 1.0 / IOR );
	vec3 q3 = P3 - C;
	float b3 = dot( q3, T3 );
	vec3 P4 = P3 + T3 * ( - b3 + sqrt( max( b3 * b3 - dot( q3, q3 ) + uR * uR, 0.0 ) ) );
	vec3 N4 = normalize( P4 - C );
	vec3 T4 = refract( T3, - N4, IOR );
	if ( dot( T4, T4 ) < 0.5 ) T4 = reflect( T3, - N4 );
	from = P4;
	dir = T4;
}

// The light of the lamps gathered in the wall: a short fleck on the side away from each lamp and a smaller one toward it.
vec3 flecks( vec3 Np, vec3 C ) {
	vec3 g = vec3( 0.0 );
	for ( int i = 0; i < LAMPS; i ++ ) {
		vec3 to = normalize( vec3( uLampPos[ i ].xy - C.xy, 0.0 ) + vec3( 1e-4 ) );
		float d = dot( to, Np );
		g += uLampLit[ i ] * ( 1.0 - uLampCol[ i ].w ) * ( pow( max( - d, 0.0 ), 18.0 ) + 0.5 * pow( max( d, 0.0 ), 40.0 ) );
		g += uLampLit[ i ] * uLampCol[ i ].w * 0.6 * smoothstep( uR * 0.2, uR * 0.8, length( uLampPos[ i ].xy - C.xy ) ) * pow( max( d, 0.0 ), 8.0 );
	}
	return g / max( 1.0, dot( g, vec3( 0.2126, 0.7152, 0.0722 ) ) / 0.7 );
}

float seamLine( out float glint ) {
	float d = abs( vO.y );
	float w = fwidth( vO.y );
	glint = 1.0 - smoothstep( 0.004, 0.012 + w * 1.5, d );
	return 1.0 - smoothstep( 0.003, 0.003 + w * 1.2, d );
}
`

export const frontFragment = /* glsl */ `
${head}
${shared}

void main() {
	vec3 V = normalize( uEye - vP );
	vec3 N = normalize( vN );
	if ( vKind > 1.5 ) {
		gl_FragColor = vec4( seat( N, V, 1.0 ), 1.0 );
		return;
	}
	if ( vKind > 0.5 ) {
		gl_FragColor = vec4( cut( N ) * 0.85, 0.85 );
		return;
	}
	vec3 C = vec3( 0.0, 0.0, uR );
	float ndv = clamp( dot( N, V ), 0.0, 1.0 );
	float rho = sqrt( max( 0.0, 1.0 - ndv * ndv ) );
	vec3 R = reflect( - V, N );
	float F = 0.04 + 0.96 * pow( 1.0 - ndv, 5.0 );
	vec3 Np = normalize( N - V * ndv + vec3( 1e-5 ) );
	float band = smoothstep( RIN - 0.012, RIN + 0.012, rho );
	float rimward = smoothstep( 0.56, 0.78, rho );
	vec3 soft = uSoft / max( 1.0, dot( uSoft, vec3( 0.2126, 0.7152, 0.0722 ) ) / 0.35 );
	vec3 gather = flecks( Np, C );

	vec3 from;
	vec3 dir;
	through( vP, - V, C, from, dir );
	vec4 seen = floorAt( from, dir );
	float known = mix( 0.5, 1.0, seen.a );
	vec3 pic = mix( vec3( dot( seen.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) ), seen.rgb, 0.6 );
	float alpha = mix( 0.72 * known, 0.34, uTrue ) * mix( 0.7, 1.0, uArtOn ) * uBend * band;
	vec3 col = ( pic * 1.15 + lampsIn( dir, from, 0.7 ) * 0.35 + gather * 0.9 + uHaze ) * alpha;

	vec3 refl = pane( Np, rho, V, 1.0, 0.8, 0.052, 0.34, 0.0 ) * SOFT * 0.45;
	refl += floorAt( vP, R ).rgb * F * 0.9;
	refl += lampsIn( R, vP, 0.55 ) * ( 0.3 + 0.9 * F ) * rimward;
	col += refl;
	alpha = clamp( alpha + 0.012 + F * 0.6, 0.0, 1.0 );

	float ring = 1.0 - smoothstep( 0.0, 0.011, abs( rho - RIN ) );
	col *= 1.0 - 0.3 * ring;
	alpha = max( alpha, 0.35 * ring );
	float lip = 1.0 - smoothstep( 0.0, 0.018, abs( rho - RIN - 0.028 ) );
	col += lip * ( gather * 0.6 + soft * 0.1 * ( 0.3 + 0.7 * max( dot( Np, normalize( vec3( uSoftDir.xy, 0.0 ) ) ), 0.0 ) ) + uFloor * 0.03 );

	float brim = smoothstep( 0.92, 0.96, rho ) * ( 1.0 - smoothstep( 0.968, 0.985, rho ) );
	vec3 S = normalize( uSoftDir );
	float lightward = dot( Np, normalize( S - V * dot( S, V ) + vec3( 1e-4, 2e-4, 0.0 ) ) );
	col += brim * ( min( uFloor, vec3( 0.8 ) ) * 0.05 + uSoft * SOFT * ( 0.16 * pow( max( lightward, 0.0 ), 4.0 ) + 0.05 * pow( max( - lightward, 0.0 ), 6.0 ) ) + soft * 0.06 + gather * 0.6 );
	float edge = smoothstep( 0.978, 0.998, rho );
	col = mix( col, col * 0.2, edge * 0.85 );
	alpha = mix( alpha, 0.9, edge * 0.85 );

	float glint;
	float line = seamLine( glint );
	vec3 Nb = normalize( N + vAxisY * 0.5 * sign( vO.y ) );
	vec3 Rb = reflect( - V, Nb );
	col += glint * 0.35 * ( softbox( Rb, 0.15 ) * SOFT * 0.14 + lampsIn( Rb, vP, 2.4 ) * 0.08 + uHaze * 2.0 + uFloor * 0.03 );
	alpha = max( alpha, 0.1 * line );

	gl_FragColor = vec4( col, alpha );
}
`

export const backFragment = /* glsl */ `
${head}
${shared}
uniform mat4 projectionMatrix;
varying vec3 vView;
varying vec3 vMid;
varying float vRw;
void main() {
	vec3 V = normalize( uEye - vP );
	vec3 N = normalize( vN );
	gl_FragDepth = gl_FragCoord.z;
	if ( vKind > 1.5 ) {
		gl_FragColor = vec4( seat( - N, V, 0.35 ), 1.0 );
		return;
	}
	if ( vKind > 0.5 ) {
		gl_FragColor = vec4( cut( - N ) * 0.85, 0.85 );
		return;
	}
	float nb = clamp( - dot( N, V ), 0.0, 1.0 );
	float rho = sqrt( max( 0.0, 1.0 - nb * nb ) );
	vec3 Np = normalize( N + V * nb + vec3( 1e-5 ) );
	float F = 0.04 + 0.96 * pow( 1.0 - nb, 5.0 );
	vec3 R = reflect( - V, N );
	vec3 C = vec3( 0.0, 0.0, uR );
	vec3 soft = uSoft / max( 1.0, dot( uSoft, vec3( 0.2126, 0.7152, 0.0722 ) ) / 0.35 );
	vec3 col = pane( Np, rho, V, - 1.0, 0.62, 0.045, 0.2, 0.03 ) * SOFT * 0.03;
	col += lampsBack( R, vP ) * ( 0.03 + 0.4 * F );
	col += surround( R ) * F * 0.5;
	float alpha = F * 0.25;

	float shut = step( uOpen, 0.002 ) * ( 1.0 - uTrue );
	vec3 oc = uEye - C;
	float ob = dot( oc, - V );
	vec3 P1 = uEye - V * ( - ob - sqrt( max( ob * ob - dot( oc, oc ) + uR * uR, 0.0 ) ) );
	vec3 from;
	vec3 dir;
	through( P1, - V, C, from, dir );
	vec4 seen = floorAt( from, dir );
	float lens = smoothstep( 0.55, 0.82, rho ) * ( 1.0 - smoothstep( RIN - 0.012, RIN + 0.012, rho ) );
	float a = 0.9 * lens * mix( 0.5, 1.0, seen.a ) * mix( 0.7, 1.0, uArtOn ) * uBend * shut;
	col += ( seen.rgb * 1.1 + lampsIn( dir, from, 0.8 ) * 0.2 ) * a;
	alpha = max( alpha, a );

	vec3 away = normalize( vec3( - uSoftDir.xy, 0.0 ) + vec3( 1e-4 ) );
	float pool = smoothstep( 0.6, 0.84, rho ) * ( 1.0 - smoothstep( RIN - 0.012, RIN + 0.012, rho ) ) * pow( max( dot( Np, away ), 0.0 ), 2.0 );
	col += ( soft * 0.16 + flecks( Np, C ) * 0.25 ) * pool * shut;

	float glint;
	float line = seamLine( glint );
	col += glint * 0.25 * ( softbox( reflect( - V, normalize( - N + vAxisY * 0.5 * sign( vO.y ) ) ), 0.15 ) * SOFT * 0.12 + uHaze * 2.0 + uFloor * 0.03 );
	alpha = max( alpha, 0.08 * line );
	if ( uOpen < 0.002 && uTrue < 0.5 ) {
		vec3 along = normalize( vView );
		float mid = dot( vMid, along );
		float off = length( vMid - along * mid ) / vRw;
		vec4 at = projectionMatrix * vec4( along * ( mid + vRw * sqrt( max( 0.0, 0.74 - off * off ) ) ), 1.0 );
		gl_FragDepth = at.z / at.w * 0.5 + 0.5;
	}
	gl_FragColor = vec4( col, alpha );
}
`

export const dropVertex = /* glsl */ `
attribute float aSeed;
uniform mat4 uToPage;
uniform float uSweat;
varying vec3 vP;
varying vec3 vN;
void main() {
	mat3 m = mat3( uToPage ) * mat3( modelMatrix ) * mat3( instanceMatrix );
	float grow = smoothstep( aSeed * 0.7, aSeed * 0.7 + 0.3, uSweat );
	vec3 centre = instanceMatrix[ 3 ].xyz;
	vec3 at = centre + ( ( instanceMatrix * vec4( position, 1.0 ) ).xyz - centre ) * grow;
	vec4 wp = modelMatrix * vec4( at, 1.0 );
	vP = ( uToPage * wp ).xyz;
	vN = normalize( m * normal );
	vec4 seen = viewMatrix * wp;
	gl_Position = projectionMatrix * seen;
	float near = ( viewMatrix * modelMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).z + 0.3 * length( modelMatrix[ 0 ].xyz );
	if ( seen.z < near ) {
		vec4 q = projectionMatrix * vec4( seen.xy, near, 1.0 );
		gl_Position.z = q.z / q.w * gl_Position.w;
	}
}
`

export const dropFragment = /* glsl */ `
${head}
varying vec3 vP;
varying vec3 vN;
void main() {
	vec3 V = normalize( uEye - vP );
	vec3 N = normalize( vN );
	if ( dot( N, V ) < 0.0 ) N = - N;
	float ndv = clamp( dot( N, V ), 0.0, 1.0 );
	vec3 R = reflect( - V, N );
	float rim = pow( 1.0 - ndv, 2.0 );
	vec3 col = softbox( R, 0.1 ) * SOFT * ( 0.08 + 0.25 * rim ) + lampsIn( R, vP, 2.2 ) * 0.12 + surround( R ) * rim;
	vec3 through = vec3( 0.0 );
	for ( int i = 0; i < LAMPS; i ++ ) through += uLampLit[ i ] * pow( max( dot( - normalize( uLampPos[ i ] - vP ), N ), 0.0 ), 3.0 );
	col += through * 0.25 + uSoft * 0.2 * pow( max( dot( - normalize( uSoftDir ), N ), 0.0 ), 3.0 );
	float alpha = 0.1 + 0.55 * rim;
	gl_FragColor = vec4( col, alpha );
}
`

export const decalVertex = /* glsl */ `
uniform float uSize;
varying vec2 vXY;
void main() {
	vXY = position.xy * uSize;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

export const decalFragment = /* glsl */ `
uniform vec4 uShade[ 3 ];
uniform vec3 uSpot[ 3 ];
uniform float uR;
uniform float uNear;
uniform float uLift;
varying vec2 vXY;
void main() {
	float keep = 1.0;
	vec3 c = vec3( 0.0 );
	for ( int i = 0; i < 3; i ++ ) {
		vec2 d = uShade[ i ].xy;
		float k = uShade[ i ].z;
		vec2 side = vec2( - d.y, d.x );
		vec2 q = vXY - d * ( uR * 0.85 * k + uLift * k );
		float along = dot( q, d ) / ( uR * 0.95 * sqrt( 1.0 + k * k ) );
		float across = dot( q, side ) / ( uR * 0.9 );
		float e = along * along + across * across;
		keep *= 1.0 - uShade[ i ].w * ( 1.0 - smoothstep( 0.42, 1.0, e ) ) * ( 1.0 - 0.55 * smoothstep( - 0.3, 1.0, along ) );
		vec2 s = vXY - d * ( uR * ( 0.34 + 0.5 * k ) + uLift * k );
		float sa = dot( s, d ) / uR;
		float sc = dot( s, side ) / uR;
		float core = 1.5 * exp( - ( sa * sa / 0.014 + sc * sc / 0.006 ) ) + 0.05 * exp( - ( sa * sa / 0.08 + sc * sc / 0.03 ) );
		float ray = 0.07 * exp( - ( sa * sa / 0.08 + sc * sc / 0.0016 ) ) + 0.04 * exp( - ( sa * sa / 0.002 + sc * sc / 0.03 ) );
		float da = ( sa + sc ) * 0.7071;
		float db = ( sa - sc ) * 0.7071;
		ray += 0.02 * ( exp( - ( da * da / 0.05 + db * db / 0.002 ) ) + exp( - ( db * db / 0.05 + da * da / 0.002 ) ) );
		float ring = ( length( s ) / uR - 0.36 ) / 0.06;
		float arc = 0.07 * exp( - ring * ring ) * pow( max( dot( normalize( s + vec2( 1e-4 ) ), d ), 0.0 ), 3.0 );
		c += uSpot[ i ] * ( core + ray + arc );
	}
	keep *= 1.0 - 0.8 * uNear * exp( - dot( vXY, vXY ) / ( uR * uR * 0.24 ) );
	float fade = 1.0 - smoothstep( 0.8, 1.0, length( vXY ) / ( uR * 5.2 ) );
	gl_FragColor = vec4( c * fade, ( 1.0 - keep ) * fade );
}
`
