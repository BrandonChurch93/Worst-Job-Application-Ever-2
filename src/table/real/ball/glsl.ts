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
uniform vec4 uFlat;
uniform vec4 uBoxAt[ BOXES ];
uniform vec4 uBoxCol[ BOXES ];
uniform vec3 uFlatCol;
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
	vec4 seen = floorAt( Pout, T2 );
	vec3 bent = seen.rgb;
	float known = mix( 0.5, 1.0, seen.a );

	vec3 gather = vec3( 0.0 );
	for ( int i = 0; i < LAMPS; i ++ ) {
		gather += uLampLit[ i ] * ( 1.0 - uLampCol[ i ].w ) * pow( max( dot( - normalize( uLampPos[ i ] - C ), Np ), 0.0 ), 5.0 );
		vec3 to = vec3( uLampPos[ i ].xy - C.xy, 0.0 );
		gather += uLampLit[ i ] * uLampCol[ i ].w * 0.6 * smoothstep( uR * 0.2, uR * 0.8, length( to ) ) * pow( max( dot( normalize( to + vec3( 1e-4 ) ), Np ), 0.0 ), 2.0 );
	}

	float band = smoothstep( RIN - 0.012, RIN + 0.012, rho );
	float lens = smoothstep( 0.55, RIN, rho );
	float aIn = mix( 0.04, 0.62 * known, lens * lens );
	float alpha = mix( mix( aIn, 0.95 * known, band ), mix( 0.03, 0.34, band ), uTrue ) * mix( 0.7, 1.0, uArtOn );
	vec3 col = ( bent * mix( 1.15, 1.9, band ) + ( gather * 0.5 + uHaze + uSoft * 0.1 ) * band ) * alpha;

	vec3 away = normalize( vec3( - uSoftDir.xy, 0.0 ) + vec3( 1e-4 ) );
	float far = pow( max( dot( Np, away ), 0.0 ), 2.0 );
	float pool = smoothstep( 0.42, 0.8, rho ) * ( 1.0 - band );
	col += ( uSoft * 0.34 * far + gather * 0.4 ) * pool;
	col += ( uSoft * 0.022 + uFloor * 0.008 ) * ( 0.4 + 0.6 * rho );
	alpha = clamp( alpha + 0.1 * pool * far, 0.0, 1.0 );

	vec3 Ni = normalize( N + 0.1 * Np );
	vec3 Ri = reflect( - V, Ni );
	vec3 refl = softbox( R, 0.03 ) * SOFT * ( 0.34 + 0.9 * pow( 1.0 - ndv, 2.0 ) );
	refl += softbox( Ri, 0.16 ) * SOFT * 0.1;
	refl += floorAt( vP, R ).rgb * F * 0.9;
	refl += lampsIn( R, vP, 1.0 ) * ( 0.12 + 0.9 * F );
	refl += lampsIn( Ri, vP, 0.7 ) * 0.06;
	refl += lampsIn( T2, Pout, 0.8 ) * 0.1 * lens;
	col += refl;
	alpha = clamp( alpha + F * 0.6, 0.0, 1.0 );

	float ring = 1.0 - smoothstep( 0.0, 0.014, abs( rho - RIN ) );
	col *= 1.0 - 0.4 * ring;
	alpha = max( alpha, 0.5 * ring );
	float lip = 1.0 - smoothstep( 0.0, 0.022, abs( rho - RIN - 0.032 ) );
	col += lip * ( softbox( reflect( - V, normalize( N - 0.6 * Np ) ), 0.25 ) * SOFT * 0.12 + gather * 0.5 + uFloor * 0.05 );

	float brim = smoothstep( 0.9, 0.955, rho ) * ( 1.0 - smoothstep( 0.965, 0.985, rho ) );
	col += brim * ( uFloor * 0.1 + uSoft * 0.25 * ( 0.4 + 0.6 * max( dot( Np, normalize( vec3( uSoftDir.xy, 0.0 ) ) ), 0.0 ) ) + gather * 0.4 );
	float edge = smoothstep( 0.972, 0.996, rho );
	col = mix( col, col * 0.12, edge * 0.9 );
	alpha = mix( alpha, 0.97, edge * 0.9 );

	float glint;
	float line = seamLine( glint );
	vec3 Nb = normalize( N + vAxisY * 0.5 * sign( vO.y ) );
	vec3 Rb = reflect( - V, Nb );
	col += glint * 0.5 * ( softbox( Rb, 0.15 ) * SOFT * 0.14 + lampsIn( Rb, vP, 2.4 ) * 0.08 + uHaze * 2.0 + uFloor * 0.03 );
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
	vec3 col = softbox( R, 0.1 ) * SOFT * ( 0.008 + 0.06 * pow( 1.0 - nb, 2.5 ) );
	col += lampsIn( R, vP, 1.4 ) * ( 0.03 + 0.4 * F );
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
		float across = dot( q, side ) / ( uR * 0.82 );
		float e = along * along + across * across;
		keep *= 1.0 - uShade[ i ].w * ( 1.0 - smoothstep( 0.42, 1.0, e ) ) * ( 1.0 - 0.3 * smoothstep( - 0.2, 1.0, along ) );
		vec2 s = vXY - d * ( uR * ( 0.5 + 0.62 * k ) + uLift * k );
		float sa = dot( s, d ) / uR;
		float sc = dot( s, side ) / uR;
		float core = 1.5 * exp( - ( sa * sa / 0.014 + sc * sc / 0.006 ) ) + 0.05 * exp( - ( sa * sa / 0.08 + sc * sc / 0.03 ) );
		float ray = 0.16 * exp( - ( sa * sa / 0.14 + sc * sc / 0.0016 ) ) + 0.1 * exp( - ( sa * sa / 0.002 + sc * sc / 0.05 ) );
		float da = ( sa + sc ) * 0.7071;
		float db = ( sa - sc ) * 0.7071;
		ray += 0.05 * ( exp( - ( da * da / 0.05 + db * db / 0.002 ) ) + exp( - ( db * db / 0.05 + da * da / 0.002 ) ) );
		float ring = ( length( s ) / uR - 0.36 ) / 0.06;
		float arc = 0.16 * exp( - ring * ring ) * pow( max( dot( normalize( s + vec2( 1e-4 ) ), d ), 0.0 ), 3.0 );
		c += uSpot[ i ] * ( core + ray + arc );
	}
	keep *= 1.0 - 0.8 * uNear * exp( - dot( vXY, vXY ) / ( uR * uR * 0.24 ) );
	float fade = 1.0 - smoothstep( 0.8, 1.0, length( vXY ) / ( uR * 5.2 ) );
	gl_FragColor = vec4( c * fade, ( 1.0 - keep ) * fade );
}
`
