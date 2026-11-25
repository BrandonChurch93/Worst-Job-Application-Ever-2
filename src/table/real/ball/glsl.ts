import { LAMPS } from './lamps'

// What every surface of the ball shares: the lamps as the ball sees them, the soft light from above, the dark surround.
export const head = /* glsl */ `
#define LAMPS ${LAMPS}
#define SOFT 9.0
uniform vec3 uEye;
uniform vec3 uSoft;
uniform vec3 uSoftDir;
uniform vec3 uHaze;
uniform vec3 uFloor;
uniform vec3 uGround;
uniform vec3 uLampPos[ LAMPS ];
uniform vec3 uLampCol[ LAMPS ];
uniform float uR;

vec3 softbox( vec3 d, float blur ) {
	vec3 s = normalize( uSoftDir );
	vec3 a = normalize( cross( vec3( 0.0, 0.0, 1.0 ), s ) );
	vec3 b = cross( s, a );
	float f = dot( d, s );
	if ( f <= 0.02 ) return vec3( 0.0 );
	float x = dot( d, a ) / f;
	float y = dot( d, b ) / f;
	float e = 0.05 + blur;
	float m = ( 1.0 - smoothstep( 0.78 - e, 0.78 + e, abs( x ) ) ) * ( 1.0 - smoothstep( 0.46 - e, 0.46 + e, abs( y ) ) );
	float bar = smoothstep( 0.03, 0.08 + blur, abs( x + 0.12 ) );
	return uSoft * m * ( 0.4 + 0.6 * bar );
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
		float size = clamp( 15.0 / dist, 0.03, 0.15 ) * wide;
		float k = 2.0 * ( 1.0 - dot( r, to / dist ) );
		c += uLampCol[ i ] * exp( - k / ( size * size ) );
	}
	return c;
}
`

export const shellVertex = /* glsl */ `
attribute float aHalf;
attribute float aKind;
uniform mat4 uToPage;
uniform float uOpen;
varying vec3 vO;
varying vec3 vP;
varying vec3 vN;
varying vec3 vAxisY;
varying vec3 vAxisZ;
varying float vKind;
varying vec2 vUv;
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
	mat3 m = mat3( uToPage ) * mat3( modelMatrix );
	vec4 wp = modelMatrix * vec4( p, 1.0 );
	vO = position;
	vP = ( uToPage * wp ).xyz;
	vN = normalize( m * n );
	vAxisY = normalize( m * vec3( 0.0, 1.0, 0.0 ) );
	vAxisZ = normalize( m * vec3( 0.0, 0.0, 1.0 ) );
	vKind = aKind;
	vUv = uv;
	gl_Position = projectionMatrix * viewMatrix * wp;
	if ( aKind > 0.5 && aKind < 1.5 && uOpen < 0.002 ) gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
}
`

const shared = /* glsl */ `
uniform sampler2D uArt;
uniform float uArtOn;
uniform vec2 uBallUv;
uniform float uDrop;
uniform float uTrue;
uniform float uPlugTurn;
uniform float uOpen;
varying vec3 vO;
varying vec3 vP;
varying vec3 vN;
varying vec3 vAxisY;
varying vec3 vAxisZ;
varying float vKind;
varying vec2 vUv;
#define RIN 0.875

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
	vec3 c = metal * ( surround( rm ) * 2.0 + softbox( rm, 0.5 ) * SOFT * 0.2 + lampsIn( rm, vP, 3.2 ) * 0.5 + uSoft * 0.75 * ( 0.45 + 0.55 * max( dot( nn, normalize( uSoftDir ) ), 0.0 ) ) + uHaze * 3.0 );
	c *= mix( 1.0, 0.22, slot );
	c *= mix( 1.0, 0.12, gap );
	return c * under;
}

vec3 cut( vec3 n ) {
	vec3 c = uHaze * 3.0 + uSoft * 0.22 * ( 0.4 + 0.6 * max( dot( n, normalize( uSoftDir ) ), 0.0 ) );
	for ( int i = 0; i < LAMPS; i ++ ) c += uLampCol[ i ] * 0.12 * max( dot( n, normalize( uLampPos[ i ] - vP ) ), 0.0 );
	return c;
}

float seamLine( out float glint ) {
	float d = abs( vO.y );
	float w = fwidth( vO.y );
	glint = 1.0 - smoothstep( 0.006, 0.022 + w * 1.5, d );
	return 1.0 - smoothstep( 0.0035, 0.0035 + w * 1.2, d );
}
`

export const frontFragment = /* glsl */ `
${head}
${shared}

vec3 floorAt( vec3 from, vec3 dir ) {
	if ( dir.z > - 0.04 ) return surround( dir ) + softbox( dir, 0.1 ) * 0.6;
	float t = ( uDrop - from.z ) / dir.z;
	vec2 hit = from.xy + dir.xy * t;
	vec2 uv = uBallUv + hit / vec2( 1920.0, 1080.0 );
	vec3 art = mix( uGround, texture2D( uArt, uv ).rgb, uArtOn );
	float inside = mix( 1.0, step( abs( uv.x - 0.5 ), 0.5 ) * step( abs( uv.y - 0.5 ), 0.5 ), uArtOn );
	float fade = exp( - length( hit ) / ( uR * 16.0 ) );
	vec3 glow = vec3( 0.0 );
	for ( int i = 0; i < LAMPS; i ++ ) {
		vec2 q = hit - uLampPos[ i ].xy;
		glow += uLampCol[ i ] * exp( - dot( q, q ) / 2600.0 ) * step( uLampPos[ i ].z - uDrop, 70.0 );
	}
	return mix( surround( dir ), art * uFloor + min( glow * 0.5, vec3( 1.6 ) ), inside * fade );
}

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

	vec3 T = refract( - V, N, 1.0 / 1.49 );
	vec3 Pout = vP + T * ( - 2.0 * dot( vP - C, T ) );
	vec3 N2 = normalize( Pout - C );
	vec3 T2 = refract( T, - N2, 1.49 );
	if ( dot( T2, T2 ) < 0.5 ) T2 = reflect( T, - N2 );
	vec3 bent = floorAt( Pout, T2 );

	vec3 gather = vec3( 0.0 );
	for ( int i = 0; i < LAMPS; i ++ ) gather += uLampCol[ i ] * pow( max( dot( - normalize( uLampPos[ i ] - C ), Np ), 0.0 ), 5.0 );

	float band = smoothstep( RIN - 0.012, RIN + 0.012, rho );
	float lens = smoothstep( 0.42, RIN, rho );
	float aIn = mix( 0.05, 0.5, lens * lens );
	float alpha = mix( mix( aIn, 0.93, band ), mix( 0.03, 0.34, band ), uTrue );
	vec3 col = ( bent * mix( 1.0, 1.25, band ) + gather * 0.5 * band + uHaze * band ) * alpha;

	vec3 Ni = normalize( N + 0.1 * Np );
	vec3 Ri = reflect( - V, Ni );
	vec3 refl = softbox( R, 0.1 ) * SOFT * ( 0.17 + 0.4 * pow( 1.0 - ndv, 3.0 ) );
	refl += softbox( Ri, 0.16 ) * SOFT * 0.05;
	refl += surround( R ) * F;
	refl += lampsIn( R, vP, 1.0 ) * ( 0.55 + 1.2 * F );
	refl += lampsIn( Ri, vP, 0.7 ) * 0.3;
	col += refl;
	alpha = clamp( alpha + F * 0.6, 0.0, 1.0 );

	float ring = 1.0 - smoothstep( 0.0, 0.014, abs( rho - RIN ) );
	col *= 1.0 - 0.4 * ring;
	alpha = max( alpha, 0.5 * ring );
	float lip = 1.0 - smoothstep( 0.0, 0.022, abs( rho - RIN - 0.032 ) );
	col += lip * ( softbox( reflect( - V, normalize( N - 0.6 * Np ) ), 0.25 ) * SOFT * 0.05 + gather * 0.3 );

	float edge = smoothstep( 0.97, 0.998, rho );
	col = mix( col, uHaze * 0.6 + gather * 0.12, edge * 0.7 );
	alpha = mix( alpha, 0.96, edge * 0.7 );

	float glint;
	float line = seamLine( glint );
	vec3 Nb = normalize( N + vAxisY * 0.5 * sign( vO.y ) );
	vec3 Rb = reflect( - V, Nb );
	col += glint * 0.5 * ( softbox( Rb, 0.15 ) * SOFT * 0.14 + lampsIn( Rb, vP, 2.4 ) * 0.7 + uHaze * 2.0 + uFloor * 0.03 );
	col *= 1.0 - 0.6 * line;
	alpha = max( alpha, 0.55 * line );

	gl_FragColor = vec4( col, alpha );
}
`

export const backFragment = /* glsl */ `
${head}
${shared}
void main() {
	vec3 V = normalize( uEye - vP );
	vec3 N = normalize( vN );
	if ( vKind > 1.5 ) {
		gl_FragColor = vec4( seat( - N, V, 0.35 ), 1.0 );
		return;
	}
	if ( vKind > 0.5 ) {
		gl_FragColor = vec4( cut( - N ) * 0.85, 0.85 );
		return;
	}
	float nb = clamp( - dot( N, V ), 0.0, 1.0 );
	float F = 0.04 + 0.96 * pow( 1.0 - nb, 5.0 );
	vec3 R = reflect( - V, N );
	vec3 col = softbox( R, 0.14 ) * SOFT * ( 0.085 + 0.2 * pow( 1.0 - nb, 3.0 ) );
	col += lampsIn( R, vP, 1.4 ) * ( 0.25 + 0.5 * F );
	col += surround( R ) * F * 0.5;
	float alpha = F * 0.25;
	float glint;
	float line = seamLine( glint );
	col += glint * 0.3 * ( softbox( reflect( - V, normalize( - N + vAxisY * 0.5 * sign( vO.y ) ) ), 0.15 ) * SOFT * 0.12 + uHaze * 2.0 + uFloor * 0.03 );
	col *= 1.0 - 0.5 * line;
	alpha = max( alpha, 0.4 * line );
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
	gl_Position = projectionMatrix * viewMatrix * wp;
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
	vec3 col = softbox( R, 0.1 ) * SOFT * ( 0.08 + 0.25 * rim ) + lampsIn( R, vP, 2.2 ) * 1.1 + surround( R ) * rim;
	vec3 through = vec3( 0.0 );
	for ( int i = 0; i < LAMPS; i ++ ) through += uLampCol[ i ] * pow( max( dot( - normalize( uLampPos[ i ] - vP ), N ), 0.0 ), 3.0 );
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
		vec2 q = vXY - d * ( uR * ( 0.3 + 0.5 * k ) + uLift * k );
		float along = dot( q, d ) / ( uR * ( 0.78 + 0.42 * k ) );
		float across = dot( q, side ) / ( uR * 0.8 );
		float e = along * along + across * across;
		keep *= 1.0 - uShade[ i ].w * ( 1.0 - smoothstep( 0.15, 1.5, e ) );
		vec2 s = vXY - d * ( uR * ( 0.42 + 0.3 * k ) + uLift * k );
		float sa = dot( s, d ) / uR;
		float sc = dot( s, side ) / uR;
		float core = exp( - ( sa * sa / 0.05 + sc * sc / 0.018 ) );
		float ray = 0.45 * exp( - ( sa * sa / 0.4 + sc * sc / 0.0022 ) ) + 0.28 * exp( - ( sa * sa / 0.005 + sc * sc / 0.16 ) );
		float arc = 0.3 * exp( - pow( ( length( s ) / uR - 0.36 ) / 0.06, 2.0 ) ) * pow( max( dot( normalize( s + vec2( 1e-4 ) ), d ), 0.0 ), 3.0 );
		c += uSpot[ i ] * ( core + ray + arc );
	}
	keep *= 1.0 - 0.5 * uNear * exp( - dot( vXY, vXY ) / ( uR * uR * 0.13 ) );
	float fade = 1.0 - smoothstep( 0.8, 1.0, length( vXY ) / ( uR * 3.0 ) );
	gl_FragColor = vec4( c * fade, ( 1.0 - keep ) * fade );
}
`
