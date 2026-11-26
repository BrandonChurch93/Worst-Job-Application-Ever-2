import * as THREE from 'three'
import type { Zone } from '../zone'
import { BALL, COLS, W } from '../../layout'
import { FLASH } from './colours'
import { CHANNELS, HIGH_BODY, HIGHS, LAMP, LIT, SPILLS } from './groups'
import { BALLS, BAT, BATS } from './key'
import { BODY, CORE } from './pictures'
import { zoneLight, type ZoneLight } from './state'
import { surroundOf } from './surround'

const pars = /* glsl */ `
uniform sampler2D wjlA;
uniform sampler2D wjlB;
uniform sampler2D wjlC;
uniform mat4 wjlViewInverse;
uniform vec3 wjlFrame;
uniform vec2 wjlSize;
uniform vec3 wjlCol[ ${CHANNELS} ];
uniform vec3 wjlFull[ ${CHANNELS} ];
uniform vec4 wjlSpill[ ${SPILLS} ];
uniform vec3 wjlSpillCol[ ${SPILLS} ];
uniform vec3 wjlSpillComb[ ${SPILLS} ];
uniform vec4 wjlHigh[ ${HIGHS} ];
uniform vec3 wjlHighCol[ ${HIGHS} ];
uniform vec4 wjlAt[ ${CHANNELS} ];
uniform vec3 wjlFill;
uniform vec4 wjlHole[ 2 ];
uniform float wjlEnv;
uniform vec2 wjlDeep;
uniform sampler2D wjlKey;
uniform vec3 wjlKeyDir;
uniform vec3 wjlKeyCol;
uniform vec4 wjlBall[ ${BALLS} ];
uniform vec4 wjlBat[ ${BATS} ];
`

// The deck of the frame outside a tier's pit stands at the page's surface, over every lamp of the tier: no lamp reaches its top.
const EDGE = (COLS.launchB - W / 2) * BALL

// A lacquered floor is never a clean mirror: the fine scratches of play spread each lamp near it into a soft pool in the lamp's own colour, whatever the colour of the print under the lacquer.
const HAZE = 0.042

// Lacquer seen along the floor sends back more of the light on it than lacquer seen from above: the sheen of a waxed floor from across the room. Nothing is added straight down.
const SHEEN = { coat: 0.03, pools: 0.0, worn: 0.2, from: 0.07, to: 0.24, veil: 0.4 }

// Metal leaf laid in a floor is not a mirror: it is beaten thin over the grain of the print and throws a lamp's light back in every direction, in its own colour.
const LEAF = 1.1

// Lacquer is not a flat mirror: the orange peel of the coat draws each lamp out into a streak that runs toward the eye, longer the lower the eye. A lamp is looked for at several heights along the turned line of sight, a different set for each pixel.
const STREAK = { taps: 6, head: 0.5, at: 0.3, near: 0.42, far: 1.25, level: 2.2, long: 2.0 }

// Print under lacquer is dark where no lamp stands near: the coat sends most of a far lamp's light away from the eye, and only in the pool round a lamp does the print show in full.
const DEEP = { from: 0.12, to: 1.3 }

// How much of a lamp wet lacquer shows from straight above. Dry lacquer shows 0.04; the approved floors are wetter than that.
const WET = 0.1

// How bright the floor before a lit opening is with what the opening throws on it.
const SPILL = 1.1

// The image of a lit front in the lacquer: how sharp its edge is at the foot of the wall in pixels, how fast it blurs with the height it mirrors, and where the sill of the lowest windows stands as a share of the front's height.
const MIRROR = { sharp: 3, blur: 0.2, sill: 0.14 }

// The lacquer is a dark mirror too: it shows each lamp over it as a small bright spot where the eye's line, turned by the floor, meets the lamp. From straight above the spot lies under its lamp, from a low eye it runs out toward the eye.
const GLINT = { level: 5.0, body: 13, low: 30 }

// The shadows of the head lamps. A wall is asked a little outside its own foot, and a thing that stands is taken a little higher than it is, so nothing lies in its own shadow; `soft` is how many pixels of height the tip of a shadow fades over, `edge` how much of its depth its side does.
export const SHADOW = { out: 12, slack: 6, lean: 0.35, soft: 10, edge: 0.5, ball: 0.07, steel: 0.92, clear: 0.4, spot: 0.9, spotAt: 0.1, gloss: 0.6, far: 0.22, near: 1.5, riser: 0.06, riserReach: 150, roof: 0.75, roofFrom: 60, roofTo: 100 }

// For each group: its picture at the fragment's place, a term for the fragment's height and for the way its surface faces the lamps, the group's colour and level.
const body = /* glsl */ `
{
	vec3 wjlP = ( wjlViewInverse * vec4( - vViewPosition, 1.0 ) ).xyz - wjlFrame;
	vec3 wjlN = normalize( ( wjlViewInverse * vec4( geometryNormal, 0.0 ) ).xyz );
	vec2 wjlUv = wjlP.xy / wjlSize + 0.5;
	vec4 wjlTa = texture2D( wjlA, wjlUv );
	vec4 wjlTb = texture2D( wjlB, wjlUv );
	vec4 wjlTc = texture2D( wjlC, wjlUv );
	float wjlPhi[ ${CHANNELS} ];
	wjlPhi[ 0 ] = wjlTa.r; wjlPhi[ 1 ] = wjlTa.g; wjlPhi[ 2 ] = wjlTa.b; wjlPhi[ 3 ] = wjlTa.a;
	wjlPhi[ 4 ] = wjlTb.r; wjlPhi[ 5 ] = wjlTb.g; wjlPhi[ 6 ] = wjlTb.b; wjlPhi[ 7 ] = wjlTb.a;
	wjlPhi[ 8 ] = wjlTc.r; wjlPhi[ 9 ] = wjlTc.g;
	for ( int i = 0; i < ${CHANNELS - 1}; i ++ ) if ( wjlPhi[ i ] < 0.0 ) wjlPhi[ i ] = ${CORE.light.toFixed(1)};
	float wjlInside = step( abs( wjlUv.x - 0.5 ), 0.5 ) * step( abs( wjlUv.y - 0.5 ), 0.5 );
	float wjlSide = length( wjlTc.ba );
	vec2 wjlToward = wjlSide > 0.0001 ? wjlTc.ba / wjlSide : vec2( 1.0, 0.0 );
	float wjlLean = clamp( wjlPhi[ ${CHANNELS - 1} ], 0.2, 0.999 );
	float wjlRun = wjlLean / sqrt( 1.0 - wjlLean * wjlLean );
	float wjlCut = 1.0;
	for ( int h = 0; h < 2; h ++ ) {
		vec2 wjlOff = wjlP.xy - wjlHole[ h ].xy;
		wjlCut -= wjlHole[ h ].w * exp( - dot( wjlOff, wjlOff ) / ( wjlHole[ h ].z * wjlHole[ h ].z ) );
	}
	wjlCut = max( wjlCut, 0.0 );
	float wjlUp = max( wjlP.z, 0.0 );
	#ifdef WJL_GLASS
	float wjlClear = 0.25;
	#else
	float wjlClear = 1.0;
	#endif
	float wjlWall = 1.0 - smoothstep( 0.3, 0.9, wjlN.z );
	float wjlTop = 1.0 - wjlWall;
	float wjlRim = wjlFrame.z < - 1.0 ? - wjlFrame.z : 1.0e6;
	float wjlPit = 1.0 - wjlTop * smoothstep( wjlRim - 24.0, wjlRim - 4.0, wjlUp ) * smoothstep( ${EDGE.toFixed(1)}, ${(EDGE + 36).toFixed(1)}, abs( wjlP.x ) );
	wjlInside *= wjlPit;
	float wjlShine = 1.0 - smoothstep( 0.9, 0.995, wjlN.z ) * ( 1.0 - smoothstep( 4.0, 16.0, wjlUp ) );
	IncidentLight wjlLight;
	vec3 wjlDiff0 = reflectedLight.directDiffuse;
	wjlLight.visible = true;
	vec3 wjlField = vec3( 0.0 );
	vec3 wjlHaze = vec3( 0.0 );
	vec3 wjlSeen = vec3( 0.0 );
	vec3 wjlSpilt = vec3( 0.0 );
	float wjlFlat = 1.0 - wjlShine;
	vec3 wjlBack = normalize( ( wjlViewInverse * vec4( geometryViewDir, 0.0 ) ).xyz );
	vec3 wjlRay = vec3( - wjlBack.xy, max( wjlBack.z, 0.06 ) );
	float wjlFace = 1.0 - clamp( wjlBack.z, 0.0, 1.0 );
	float wjlMirror = wjlFlat * ( ${WET.toFixed(2)} + ${(1 - WET).toFixed(2)} * wjlFace * wjlFace ) * smoothstep( 0.02, 0.12, wjlBack.z );
	if ( wjlMirror > 0.0 ) {
		float wjlGrain = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
		for ( int t = 0; t < ${STREAK.taps}; t ++ ) {
			float wjlStep = t == 0 ? 0.0 : ( float( t - 1 ) + wjlGrain ) / ${(STREAK.taps - 1).toFixed(1)};
			float wjlHigh = t == 0 ? ${STREAK.at.toFixed(2)} : ${STREAK.near.toFixed(2)} * pow( ${(STREAK.far / STREAK.near).toFixed(3)}, wjlStep );
			float wjlPart = t == 0 ? ${(STREAK.level * STREAK.head).toFixed(4)} : ${((STREAK.level * (1 - STREAK.head) * 2) / (STREAK.taps - 1)).toFixed(4)} * ( 1.0 - wjlStep ) * ( 1.0 - wjlStep ) * 1.5;
			vec2 wjlOver = ( wjlP.xy + wjlRay.xy / wjlRay.z * ${LAMP.z.toFixed(1)} * wjlHigh ) / wjlSize + 0.5;
			float wjlIn = step( abs( wjlOver.x - 0.5 ), 0.5 ) * step( abs( wjlOver.y - 0.5 ), 0.5 ) * wjlPart;
			vec4 wjlRa = texture2D( wjlA, wjlOver );
			vec4 wjlRb = texture2D( wjlB, wjlOver );
			vec4 wjlRc = texture2D( wjlC, wjlOver );
			float wjlRho[ ${CHANNELS} ];
			wjlRho[ 0 ] = wjlRa.r; wjlRho[ 1 ] = wjlRa.g; wjlRho[ 2 ] = wjlRa.b; wjlRho[ 3 ] = wjlRa.a;
			wjlRho[ 4 ] = wjlRb.r; wjlRho[ 5 ] = wjlRb.g; wjlRho[ 6 ] = wjlRb.b; wjlRho[ 7 ] = wjlRb.a;
			wjlRho[ 8 ] = wjlRc.r; wjlRho[ 9 ] = 0.0;
			for ( int i = 0; i < ${CHANNELS}; i ++ ) {
				if ( wjlAt[ i ].w > 1.5 && wjlAt[ i ].w < 2.5 ) wjlSeen += wjlFull[ i ] * smoothstep( ${(CORE.level * 0.12).toFixed(1)}, ${(CORE.level * 0.5).toFixed(1)}, - wjlRho[ i ] ) * wjlIn;
			}
		}
		vec3 wjlLine = wjlRay / length( wjlRay );
		vec3 wjlSide = normalize( vec3( wjlLine.y, - wjlLine.x, 0.0001 ) );
		vec3 wjlRise = cross( wjlSide, wjlLine );
		for ( int i = 0; i < ${CHANNELS}; i ++ ) {
			vec4 at = wjlAt[ i ];
			if ( at.w > 0.5 && at.w < 1.5 && at.z > ${GLINT.low.toFixed(1)} ) {
				vec3 wjlTo = at.xyz - wjlP;
				float wjlAcross = dot( wjlTo, wjlSide );
				float wjlOver2 = dot( wjlTo, wjlRise ) / ${STREAK.long.toFixed(1)};
				wjlSeen += wjlFull[ i ] * step( 0.0, dot( wjlTo, wjlLine ) ) * exp( - ( wjlAcross * wjlAcross + wjlOver2 * wjlOver2 ) / ${(GLINT.body * GLINT.body).toFixed(1)} ) * step( 0.0001, wjlPhi[ i ] );
			}
		}
		vec2 wjlEye = wjlBack.xy / max( length( wjlBack.xy ), 0.001 );
		float wjlLow = length( wjlBack.xy ) / max( wjlBack.z, 0.05 );
		for ( int k = 0; k < ${SPILLS}; k ++ ) {
			vec4 sp = wjlSpill[ k ];
			if ( sp.z <= 0.0 ) continue;
			vec3 cb = wjlSpillComb[ k ];
			vec2 wjlAlong = cb.z > 0.5 ? vec2( 0.0, 1.0 ) : vec2( 1.0, 0.0 );
			vec2 wjlAcross = vec2( - wjlAlong.y, wjlAlong.x );
			vec2 d = wjlP.xy - sp.xy;
			float wjlTurn = dot( wjlEye, wjlAcross );
			float wjlFar = dot( d, wjlAcross ) / ( abs( wjlTurn ) > 0.05 ? wjlTurn : 0.05 );
			float wjlOn = dot( d, wjlAlong ) - wjlFar * dot( wjlEye, wjlAlong );
			float wjlTall = wjlFar / max( wjlLow, 0.001 );
			float wjlBlur = ${MIRROR.sharp.toFixed(1)} + ${MIRROR.blur.toFixed(2)} * wjlTall;
			float wjlBars = cb.x > 0.0 ? pow( 0.5 + 0.5 * cos( 6.2831853 * ( wjlOn / cb.x + cb.y ) ), 2.0 ) : 1.0;
			float wjlFoot = cb.x > 0.0 ? ${MIRROR.sill.toFixed(2)} * sp.w : 0.0;
			float wjlBand = smoothstep( wjlFoot - wjlBlur, wjlFoot + wjlBlur, wjlTall ) * ( 1.0 - smoothstep( sp.w - 2.0 * wjlBlur, sp.w + 2.0 * wjlBlur, wjlTall ) );
			wjlSpilt += wjlSpillCol[ k ] * wjlBars * wjlBand * ( 1.0 - smoothstep( sp.z - wjlBlur, sp.z + wjlBlur, abs( wjlOn ) ) ) * step( 0.0, wjlFar ) * smoothstep( 0.08, 0.3, abs( wjlTurn ) ) * ( 0.35 + 0.65 * wjlFace ) * wjlFlat;
		}
	}
	for ( int i = 0; i < ${CHANNELS}; i ++ ) {
		vec3 c = wjlCol[ i ];
		if ( c.r + c.g + c.b <= 0.0 ) continue;
		vec4 at = wjlAt[ i ];
		if ( at.w > 2.5 ) {
			wjlField += c * ( ${FLASH.flat.toFixed(3)} + ${FLASH.lamps.toFixed(3)} * min( 1.6, wjlPhi[ 0 ] ) ) * wjlInside * wjlClear * ( 0.58 + 0.42 * wjlN.z );
			continue;
		}
		float amount = wjlPhi[ i ] * wjlInside * wjlClear;
		if ( at.w < 0.5 ) {
			wjlField += c * amount * ( 0.34 + 0.66 * max( wjlN.z, 0.0 ) ) / ( 1.0 + wjlUp * wjlUp * at.z );
			wjlHaze += c * amount * smoothstep( 0.8, 2.6, amount );
			continue;
		}
		vec3 from = at.xyz;
		if ( at.w > 1.5 ) {
			from = vec3( wjlP.xy + wjlToward * at.z * wjlRun, at.z + wjlUp * wjlTop );
			amount *= wjlCut / ( 1.0 + wjlTop * wjlUp * wjlUp * ${(1 / (170 * 170)).toExponential(4)} );
			amount = mix( amount, 0.6 * amount / ( 1.0 + 1.5 * amount ), max( wjlWall, smoothstep( 40.0, 100.0, wjlUp ) ) );
			wjlHaze += c * amount * smoothstep( 0.8, 2.6, amount );
		}
		vec3 low = vec3( from.xy - wjlP.xy, at.z );
		vec3 to = from - wjlP;
		amount *= min( ( dot( low, low ) + ${(BODY * BODY).toFixed(1)} ) / ( dot( to, to ) + ${(BODY * BODY).toFixed(1)} ), at.w > 1.5 ? 1.4 : 3.0 );
		wjlLight.direction = normalize( ( viewMatrix * vec4( to, 0.0 ) ).xyz );
		wjlLight.color = c * amount * PI;
		vec3 wjlGloss = reflectedLight.directSpecular;
		#ifdef USE_CLEARCOAT
		vec3 wjlCoat = clearcoatSpecularDirect;
		#endif
		RE_Direct( wjlLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
		if ( at.w > 1.5 ) {
			reflectedLight.directSpecular = mix( wjlGloss, reflectedLight.directSpecular, wjlShine * ( 1.0 - 0.6 * wjlWall ) );
			#ifdef USE_CLEARCOAT
			clearcoatSpecularDirect = mix( wjlCoat, clearcoatSpecularDirect, wjlShine );
			#endif
		}
	}
	vec3 wjlKeyLit = vec3( 0.0 );
	if ( wjlKeyCol.r + wjlKeyCol.g + wjlKeyCol.b > 0.0 ) {
		float wjlOff = smoothstep( 2.0, 10.0, wjlUp );
		vec4 wjlUnder = texture2D( wjlKey, ( wjlP.xy + wjlN.xy * ${SHADOW.out.toFixed(1)} * wjlOff ) / wjlSize + 0.5 );
		float wjlAtZ = wjlUp + wjlOff * ( ${SHADOW.slack.toFixed(1)} + ${SHADOW.lean.toFixed(2)} * wjlUp );
		float wjlOpen = 0.0;
		for ( int k = 0; k < 3; k ++ ) {
			float wjlS = k == 0 ? wjlUnder.r : k == 1 ? wjlUnder.g : wjlUnder.b;
			wjlOpen += 1.0 - smoothstep( 0.0, max( ${SHADOW.soft.toFixed(1)}, ${SHADOW.edge.toFixed(2)} * wjlS ), wjlS - wjlAtZ );
		}
		wjlOpen /= 3.0;
		for ( int b = 0; b < ${BALLS}; b ++ ) {
			vec4 ball = wjlBall[ b ];
			if ( ball.w == 0.0 ) continue;
			float r = abs( ball.w );
			vec3 v = ball.xyz - wjlP;
			float t = dot( v, wjlKeyDir );
			float d = length( v - t * wjlKeyDir );
			float wide = 2.0 + ${SHADOW.ball.toFixed(3)} * max( t, 0.0 );
			float dark = ( 1.0 - smoothstep( r - wide, r + wide, d ) ) * step( 0.0, t ) * step( r * 1.06, length( v ) );
			wjlOpen *= 1.0 - dark * ( ball.w > 0.0 ? ${SHADOW.steel.toFixed(2)} : ${SHADOW.clear.toFixed(2)} );
			if ( ball.w < 0.0 ) wjlOpen += ${SHADOW.spot.toFixed(2)} * dark * exp( - d * d / ( ${SHADOW.spotAt.toFixed(3)} * r * r ) );
		}
		vec2 wjlSlant = wjlKeyDir.xy / wjlKeyDir.z;
		for ( int b = 0; b < ${BATS}; b ++ ) {
			vec4 bat = wjlBat[ b ];
			vec2 e = bat.zw - bat.xy;
			float l2 = dot( e, e );
			if ( l2 < 1.0 || wjlUp > ${(BAT.top - 3).toFixed(1)} ) continue;
			float least = 1.0e6;
			for ( int q = 0; q < 4; q ++ ) {
				float up = mix( wjlUp, ${BAT.top.toFixed(1)}, ( float( q ) + 0.6 ) / 4.0 );
				vec2 pt = wjlP.xy + wjlSlant * ( up - wjlUp ) - bat.xy;
				float f = clamp( dot( pt, e ) / l2, 0.0, 1.0 );
				least = min( least, length( pt - e * f ) - mix( ${BAT.pivot.toFixed(1)}, ${BAT.tip.toFixed(1)}, f ) );
			}
			vec2 own = wjlP.xy - bat.xy;
			float g = clamp( dot( own, e ) / l2, 0.0, 1.0 );
			float onIt = step( length( own - e * g ) - mix( ${BAT.pivot.toFixed(1)}, ${BAT.tip.toFixed(1)}, g ), 2.0 ) * step( 2.0, wjlUp );
			wjlOpen *= 1.0 - ${SHADOW.steel.toFixed(2)} * ( 1.0 - smoothstep( - 3.0, 7.0, least ) ) * ( 1.0 - onIt );
		}
		wjlLight.direction = normalize( ( viewMatrix * vec4( wjlKeyDir, 0.0 ) ).xyz );
		float wjlNear = dot( wjlP.xy, normalize( wjlKeyDir.xy ) ) / ( 0.5 * length( wjlSize ) );
		wjlOpen *= mix( ${SHADOW.far.toFixed(2)}, ${SHADOW.near.toFixed(2)}, smoothstep( - 0.75, 0.85, wjlNear ) );
		wjlOpen *= 1.0 - ${SHADOW.roof.toFixed(2)} * wjlTop * smoothstep( ${SHADOW.roofFrom.toFixed(1)}, ${SHADOW.roofTo.toFixed(1)}, wjlUp );
		wjlLight.color = wjlKeyCol * wjlOpen * wjlInside * wjlClear * PI;
		wjlKeyLit = wjlKeyCol * wjlOpen * wjlInside * wjlClear * max( wjlKeyDir.z, 0.0 );
		vec3 wjlGloss = reflectedLight.directSpecular;
		#ifdef USE_CLEARCOAT
		vec3 wjlCoat = clearcoatSpecularDirect;
		#endif
		RE_Direct( wjlLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
		reflectedLight.directSpecular = mix( wjlGloss, reflectedLight.directSpecular, wjlShine * ${SHADOW.gloss.toFixed(2)} );
		#ifdef USE_CLEARCOAT
		clearcoatSpecularDirect = mix( wjlCoat, clearcoatSpecularDirect, wjlShine * ${SHADOW.gloss.toFixed(2)} );
		#endif
	}
	wjlField += wjlKeyCol * ${SHADOW.riser.toFixed(2)} * max( - wjlN.y, 0.0 ) * wjlWall * smoothstep( 0.5 * wjlSize.y - ${SHADOW.riserReach.toFixed(1)}, 0.5 * wjlSize.y - ${(SHADOW.riserReach * 0.4).toFixed(1)}, wjlP.y ) * wjlClear;
	for ( int k = 0; k < ${HIGHS}; k ++ ) {
		vec4 hi = wjlHigh[ k ];
		if ( hi.w <= 0.0 ) continue;
		vec3 to = hi.xyz - wjlP;
		float d2 = dot( to, to );
		float q = d2 / ( hi.w * hi.w );
		if ( q >= 1.0 ) continue;
		float w = 1.0 - q * q;
		wjlField += wjlHighCol[ k ] * w * w * ${(100 * 100 + HIGH_BODY * HIGH_BODY).toFixed(1)} / ( d2 + ${(HIGH_BODY * HIGH_BODY).toFixed(1)} ) * ( 0.4 + 0.6 * max( dot( wjlN, to ) * inversesqrt( d2 + 1.0 ), 0.0 ) ) * wjlInside * wjlClear;
	}
	wjlField += wjlFill * ( 0.5 + 0.5 * wjlN.z ) * ( 1.0 + 1.6 * wjlTop * smoothstep( 20.0, 130.0, wjlUp ) ) * wjlPit;
	reflectedLight.directDiffuse += wjlField * material.diffuseColor;
	vec3 wjlOwn = reflectedLight.directDiffuse - wjlDiff0;
	float wjlGot = dot( wjlOwn, vec3( 0.2126, 0.7152, 0.0722 ) ) / max( dot( material.diffuseColor, vec3( 0.2126, 0.7152, 0.0722 ) ), 0.02 );
	float wjlKept = min( 1.0, mix( wjlDeep.x, wjlDeep.y, wjlFace ) );
	reflectedLight.directDiffuse = wjlDiff0 + wjlOwn * mix( 1.0, wjlKept + ( 1.0 - wjlKept ) * smoothstep( ${DEEP.from.toFixed(2)}, ${DEEP.to.toFixed(2)}, wjlGot ), wjlFlat );
	#ifdef USE_CLEARCOAT
	clearcoatSpecularDirect += wjlHaze * ${HAZE.toFixed(3)} * ( 1.0 + ${SHEEN.pools.toFixed(2)} * wjlFace * wjlFace ) * ( 1.0 - wjlShine ) / ( 1.0 + 0.25 * ( wjlHaze.r + wjlHaze.g + wjlHaze.b ) );
	float wjlWorn = smoothstep( ${SHEEN.from.toFixed(2)}, ${SHEEN.to.toFixed(2)}, material.clearcoatRoughness );
	clearcoatSpecularDirect += ( wjlField + wjlKeyLit ) * ( ${SHEEN.coat.toFixed(3)} + ${SHEEN.worn.toFixed(3)} * wjlWorn ) * wjlFlat * wjlFace * wjlFace;
	clearcoatSpecularDirect += wjlSeen * ${GLINT.level.toFixed(2)} * wjlMirror * wjlClear * ( 1.0 - ${SHEEN.veil.toFixed(2)} * wjlWorn );
	clearcoatSpecularDirect += wjlSpilt * ${SPILL.toFixed(2)} * wjlClear * ( 1.0 - ${SHEEN.veil.toFixed(2)} * wjlWorn );
	#endif
	#ifdef STANDARD
	reflectedLight.directSpecular += wjlField * material.specularColor * ( 0.12 + ${LEAF.toFixed(2)} * wjlFlat );
	#endif
}
`

const END = '#include <lights_fragment_end>'

const emits = (m: THREE.Material): boolean => {
  const s = m as THREE.MeshStandardMaterial
  if (s.emissiveMap) return true
  return s.emissive !== undefined && s.emissive.r + s.emissive.g + s.emissive.b > 0 && (s.emissiveIntensity ?? 1) > 0
}

// A material that gives light itself and one that asks to be left unlit pass untouched. `userData.lit` asks for the light all the same.
const skips = (m: THREE.Material): boolean => m.userData.unlit === true || (m.userData.lit !== true && emits(m))

const seen = new WeakSet<THREE.Material>()

// Clear glass sends back almost none of a lamp's light as a matte thing does: it shows the lamps in its reflection.
const glass = (m: THREE.Material): boolean => m.transparent === true && m.opacity < 0.5

function patch(shader: THREE.WebGLProgramParametersWithUniforms, s: ZoneLight, light: boolean, own: boolean, clear: boolean): void {
  if (shader.fragmentShader.includes('wjlEnv')) return
  const lights = light && shader.fragmentShader.includes(END)
  if (!lights && !own) return
  Object.assign(shader.uniforms, s.uniforms)
  let f = (clear ? '#define WJL_GLASS\n' : '') + pars + (lights ? shader.fragmentShader.replace(END, body + END) : shader.fragmentShader)
  if (own) {
    if (f.includes('( envMapIntensity * wjaEnvOwn )')) f = f.replaceAll('( envMapIntensity * wjaEnvOwn )', '( wjaEnvOwn * wjlEnv )')
    else if (f.includes('#include <envmap_physical_pars_fragment>')) f = f.replace('#include <envmap_physical_pars_fragment>', THREE.ShaderChunk.envmap_physical_pars_fragment.replaceAll('* envMapIntensity', '* ( envMapIntensity * wjlEnv )'))
  }
  shader.fragmentShader = f
}

// Every material of a lit zone passes here once. From then on the light of the zone's lamps reaches it, and it reflects the zone's own dark surround.
export const hook: ((m: THREE.Material, z: Zone) => void) | null = (m, z) => {
  if (!LIT.includes(z.id) || seen.has(m)) return
  seen.add(m)
  const s = zoneLight(z)
  const standard = (m as THREE.MeshStandardMaterial).isMeshStandardMaterial === true
  const compiles = [m.onBeforeCompile]
  const keys = [m.customProgramCacheKey]
  let depth = 0
  let keyDepth = 0
  const compile = function (this: THREE.Material, shader: THREE.WebGLProgramParametersWithUniforms, renderer: THREE.WebGLRenderer): void {
    const f = compiles[compiles.length - 1 - depth]
    depth++
    try {
      if (f) f.call(m, shader, renderer)
    } finally {
      depth--
    }
    if (depth === 0) patch(shader, s, !skips(m), standard && (m as THREE.MeshStandardMaterial).envMap === surroundOf(z), glass(m))
  }
  const key = (): string => {
    const f = keys[keys.length - 1 - keyDepth]
    keyDepth++
    let k = ''
    try {
      k = f ? f.call(m) : ''
    } finally {
      keyDepth--
    }
    return keyDepth === 0 ? `${k}|wjl${skips(m) ? 0 : 1}${standard ? 1 : 0}${glass(m) ? 1 : 0}` : k
  }
  Object.defineProperty(m, 'onBeforeCompile', { configurable: true, enumerable: true, get: () => compile, set: (f: (typeof compiles)[number]) => { if (f !== compile) compiles.push(f) } })
  Object.defineProperty(m, 'customProgramCacheKey', { configurable: true, enumerable: true, get: () => key, set: (f: (typeof keys)[number]) => { if (f !== key) keys.push(f) } })
  if (standard && !(m as THREE.MeshStandardMaterial).envMap) (m as THREE.MeshStandardMaterial).envMap = surroundOf(z)
  m.userData.lightZone = z.id
  m.needsUpdate = true
}
