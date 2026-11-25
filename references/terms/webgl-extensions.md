# WebGL2 extension support in desktop browsers

Date read: 2026-11-25.

Current desktop versions per MDN browser-compat-data on that date: Chrome 158, Safari 27.2, Firefox 160, Edge 158.

## How to read this

- `true` means the MDN compatibility data shows the extension in the current desktop version of that browser, unprefixed and without a flag.
- `false` means the MDN compatibility data shows no support in that browser.
- `null` means the source has no entry. Nothing here was filled in from memory.
- Edge values marked as mirrored in the MDN data follow the Chrome entry, with Edge 79 as the earliest possible version.
- The MDN data describes the extension interface in the browser. It does not separate WebGL1 from WebGL2 and does not account for graphics hardware. The web3dsurvey figures are the share of real WebGL2 reports that expose the extension.
- Desktop share is the lowest of the Windows, macOS and Linux shares on the web3dsurvey page for the extension.

## Support table

| Extension | Chrome | Safari | Firefox | Edge | Desktop share % | Note |
|---|---|---|---|---|---|---|
| `EXT_color_buffer_float` | true | true | true | true | 99.66 | MDN first versions: Chrome 56, Safari 15, Firefox 51, Edge 79. MDN page says WebGL2 contexts only. web3dsurvey desktop shares: Windows 99.99%, macOS 99.99%, Linux 99.66%. |
| `EXT_color_buffer_half_float` | true | true | true | true | 60.97 | MDN first versions: Chrome 63, Safari 14, Firefox 47, Edge 17. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 92%, macOS 92.68%, Linux 60.97%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. MDN lists support, yet web3dsurvey shows under half of WebGL2 reports expose it in: Firefox 2.96% (all platforms). |
| `OES_texture_float_linear` | true | true | true | true | 88.99 | MDN first versions: Chrome 29, Safari 8, Firefox 24, Edge 12. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 99.99%, macOS 88.99%, Linux 97.51%. |
| `OES_texture_half_float_linear` | true | true | true | true | null | MDN first versions: Chrome 29, Safari 8, Firefox 30, Edge 14. MDN page says WebGL1 contexts only, and that in WebGL2 the feature is built in and the extension is not needed, so the browser values describe the WebGL1 extension. No web3dsurvey WebGL2 page for this name, so the desktop share could not be read and is null. |
| `EXT_float_blend` | true | true | true | true | 89.59 | MDN first versions: Chrome 75, Safari 14.1, Firefox 67, Edge 79. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 99.99%, macOS 89.59%, Linux 99.65%. |
| `EXT_texture_filter_anisotropic` | true | true | true | true | 99.31 | MDN first versions: Chrome 34, Safari 9.1, Firefox 47, Edge 12. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 99.99%, macOS 100%, Linux 99.31%. |
| `EXT_texture_norm16` | true | true | true | true | 68.99 | MDN first versions: Chrome 87, Safari 16, Firefox 159, Edge 87. MDN page says WebGL2 contexts only. web3dsurvey desktop shares: Windows 98%, macOS 98.24%, Linux 68.99%. |
| `EXT_disjoint_timer_query_webgl2` | true | false | false | true | 43.01 | MDN first versions: Chrome 70, Safari none, Firefox none, Edge 80. web3dsurvey desktop shares: Windows 85.84%, macOS 61.14%, Linux 43.01%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. |
| `KHR_parallel_shader_compile` | true | true | false | true | 41.2 | MDN first versions: Chrome 76, Safari 14.1, Firefox none, Edge 79. web3dsurvey desktop shares: Windows 89.92%, macOS 91.15%, Linux 41.2%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. |
| `OES_draw_buffers_indexed` | true | true | true | true | 97.18 | MDN first versions: Chrome 100, Safari 16, Firefox 108, Edge 100. MDN page says WebGL2 contexts only. web3dsurvey desktop shares: Windows 99.94%, macOS 99.98%, Linux 97.18%. |
| `OVR_multiview2` | true | false | true | true | 0.76 | MDN first versions: Chrome 93, Safari none, Firefox 71, Edge 93. Chrome, Firefox, Edge partial per MDN: Only supported on Windows with ANGLE. MDN page says WebGL2 contexts only. web3dsurvey desktop shares: Windows 99.47%, macOS 0.76%, Linux 36.71%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. |
| `WEBGL_multi_draw` | true | true | false | true | 61.39 | MDN first versions: Chrome 86, Safari 15, Firefox none, Edge 86. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 92.01%, macOS 92.68%, Linux 61.39%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. |
| `WEBGL_lose_context` | true | true | true | true | 99.51 | MDN first versions: Chrome 26, Safari 8, Firefox 22, Edge 17. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 100%, macOS 99.99%, Linux 99.51%. |
| `WEBGL_debug_renderer_info` | true | true | true | true | 99.89 | MDN first versions: Chrome 33, Safari 9.1, Firefox 53, Edge 12. Firefox note per MDN: Deprecated, and may be removed in a future release (see bug 1722782). MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 99.99%, macOS 100%, Linux 99.89%. |
| `WEBGL_debug_shaders` | true | true | true | true | 98.35 | MDN first versions: Chrome 47, Safari 14, Firefox 56, Edge 79. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 99.7%, macOS 99.81%, Linux 98.35%. MDN page also says the extension is not directly available to websites. |
| `WEBGL_compressed_texture_s3tc` | true | true | true | true | 88.97 | MDN first versions: Chrome 26, Safari 8, Firefox 22, Edge 12. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 99.95%, macOS 88.97%, Linux 94.62%. |
| `WEBGL_compressed_texture_s3tc_srgb` | true | true | true | true | 89.5 | MDN first versions: Chrome 60, Safari 14.1, Firefox 55, Edge 80. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 99.96%, macOS 89.5%, Linux 94.28%. |
| `EXT_texture_compression_bptc` | true | true | true | true | 85.86 | MDN first versions: Chrome 93, Safari 16, Firefox 68, Edge 93. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 99.71%, macOS 85.86%, Linux 93.11%. |
| `EXT_texture_compression_rgtc` | true | true | true | true | 89.49 | MDN first versions: Chrome 93, Safari 14.1, Firefox 65, Edge 93. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 99.96%, macOS 89.49%, Linux 93.83%. |
| `WEBGL_compressed_texture_etc` | true | true | true | true | 1.98 | MDN first versions: Chrome 63, Safari 13.1, Firefox 55, Edge 79. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 1.98%, macOS 87.72%, Linux 91.28%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. MDN lists support, yet web3dsurvey shows under half of WebGL2 reports expose it in: Chrome 49.26%, Firefox 38.78%, Edge 6.2% (all platforms). |
| `WEBGL_compressed_texture_etc1` | true | true | true | true | 1.96 | MDN first versions: Chrome 49, Safari 13.1, Firefox 55, Edge 79. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 1.96%, macOS 87.72%, Linux 54.01%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. MDN lists support, yet web3dsurvey shows under half of WebGL2 reports expose it in: Chrome 49.26%, Firefox 15.87%, Edge 6.2% (all platforms). |
| `WEBGL_compressed_texture_astc` | true | true | true | true | 1.98 | MDN first versions: Chrome 47, Safari 12, Firefox 53, Edge 79. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 1.98%, macOS 92.12%, Linux 82.6%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. MDN lists support, yet web3dsurvey shows under half of WebGL2 reports expose it in: Chrome 49.05%, Firefox 45.19%, Edge 6.2% (all platforms). |
| `WEBGL_compressed_texture_pvrtc` | true | true | false | true | 0 | MDN first versions: Chrome 124, Safari 7, Firefox none, Edge 124. Chrome, Edge partial per MDN: Supported on macOS only. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 0.03%, macOS 87%, Linux 0%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. MDN lists support, yet web3dsurvey shows under half of WebGL2 reports expose it in: Chrome 21.83%, Edge 3.95% (all platforms). MDN page says PVRTC is typically only on mobile devices with PowerVR chips. |
| `EXT_clip_control` | true | true | true | true | 79.47 | MDN first versions: Chrome 122, Safari 17.4, Firefox 159, Edge 122. web3dsurvey desktop shares: Windows 98.88%, macOS 96.05%, Linux 79.47%. |
| `EXT_depth_clamp` | true | true | true | true | 91.81 | MDN first versions: Chrome 121, Safari 17.4, Firefox 130, Edge 121. web3dsurvey desktop shares: Windows 99.13%, macOS 99.36%, Linux 91.81%. |
| `EXT_polygon_offset_clamp` | true | true | true | true | 80.93 | MDN first versions: Chrome 122, Safari 17.4, Firefox 158, Edge 122. MDN page says WebGL1 and WebGL2 contexts. web3dsurvey desktop shares: Windows 98.88%, macOS 95.94%, Linux 80.93%. MDN page says support depends on the graphics driver. |
| `WEBGL_clip_cull_distance` | null | null | null | null | 53.97 | No MDN browser-compat-data entry, so browser values could not be read and are null. web3dsurvey desktop shares: Windows 91.89%, macOS 92.14%, Linux 53.97%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. web3dsurvey shares by browser family (all platforms): Chrome 84.52%, Safari 99.23%, Firefox 2.88%, Edge 99.26%. |
| `WEBGL_polygon_mode` | true | true | false | true | 31.91 | MDN first versions: Chrome 121, Safari 17.4, Firefox none, Edge 121. web3dsurvey desktop shares: Windows 91.85%, macOS 92.07%, Linux 31.91%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. |
| `WEBGL_provoking_vertex` | null | null | null | null | 14.79 | No MDN browser-compat-data entry, so browser values could not be read and are null. web3dsurvey desktop shares: Windows 97.84%, macOS 99.13%, Linux 14.79%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. web3dsurvey shares by browser family (all platforms): Chrome 72.72%, Safari 99.22%, Firefox 63.67%, Edge 97.79%. |
| `EXT_conservative_depth` | true | true | false | true | 51.96 | MDN first versions: Chrome 122, Safari 17.5, Firefox none, Edge 122. web3dsurvey desktop shares: Windows 91.61%, macOS 91.16%, Linux 51.96%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. |
| `EXT_render_snorm` | true | true | false | true | 40.54 | MDN first versions: Chrome 126, Safari 18, Firefox none, Edge 126. web3dsurvey desktop shares: Windows 89.6%, macOS 90.41%, Linux 40.54%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. |
| `WEBGL_render_shared_exponent` | true | true | false | true | 0.03 | MDN first versions: Chrome 124, Safari 18, Firefox none, Edge 124. web3dsurvey desktop shares: Windows 0.03%, macOS 85.97%, Linux 2.03%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. MDN lists support, yet web3dsurvey shows under half of WebGL2 reports expose it in: Chrome 25.29%, Edge 4.53% (all platforms). |
| `WEBGL_stencil_texturing` | true | true | false | true | 57.45 | MDN first versions: Chrome 124, Safari 18, Firefox none, Edge 124. web3dsurvey desktop shares: Windows 91.49%, macOS 90.47%, Linux 57.45%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. |
| `WEBGL_blend_func_extended` | true | true | false | true | null | MDN first versions: Chrome 122, Safari 18, Firefox none, Edge 122. No web3dsurvey WebGL2 page for this name, so the desktop share could not be read and is null. web3dsurvey lists the name EXT_blend_func_extended instead, see that row. |
| `NV_shader_noperspective_interpolation` | true | true | false | true | 55.25 | MDN first versions: Chrome 122, Safari 17.5, Firefox none, Edge 122. web3dsurvey desktop shares: Windows 91.82%, macOS 91.94%, Linux 55.25%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. |
| `EXT_texture_mirror_clamp_to_edge` | true | true | true | true | 75.26 | MDN first versions: Chrome 124, Safari 18, Firefox 160, Edge 124. web3dsurvey desktop shares: Windows 98.55%, macOS 95.79%, Linux 75.26%. |
| `WEBGL_draw_instanced_base_vertex_base_instance` | null | null | null | null | 0.02 | No MDN browser-compat-data entry, so browser values could not be read and are null. web3dsurvey desktop shares: Windows 0.25%, macOS 0.27%, Linux 0.02%. web3dsurvey shares by browser family (all platforms): Chrome 0.25%, Safari 0.09%, Firefox 0%, Edge 0.18%. |
| `WEBGL_multi_draw_instanced_base_vertex_base_instance` | null | null | null | null | 0.01 | No MDN browser-compat-data entry, so browser values could not be read and are null. web3dsurvey desktop shares: Windows 0.23%, macOS 0.26%, Linux 0.01%. web3dsurvey shares by browser family (all platforms): Chrome 0.24%, Safari 0.06%, Firefox 0%, Edge 0.16%. |
| `OES_sample_variables` | true | true | false | true | 57.18 | MDN first versions: Chrome 126, Safari 18, Firefox none, Edge 126. web3dsurvey desktop shares: Windows 91.13%, macOS 90.45%, Linux 57.18%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. |
| `OES_shader_multisample_interpolation` | true | true | false | true | 56.96 | MDN first versions: Chrome 126, Safari 18, Firefox none, Edge 126. web3dsurvey desktop shares: Windows 91.13%, macOS 90.41%, Linux 56.96%. Desktop shares differ by 30 points or more between platforms, so it depends on platform or hardware. |
| `EXT_blend_func_extended` | null | null | null | null | 0 | No MDN browser-compat-data entry, so browser values could not be read and are null. web3dsurvey desktop shares: Windows 0%, macOS 0%, Linux 0%. web3dsurvey shares by browser family (all platforms): Chrome 0%, Safari 0%, Firefox 0%, Edge 0%. MDN lists the name WEBGL_blend_func_extended instead, see that row. |
| `WEBGL_blend_equation_advanced_coherent` | null | null | null | null | 0 | No MDN browser-compat-data entry, so browser values could not be read and are null. web3dsurvey desktop shares: Windows 0%, macOS 0%, Linux 0%. web3dsurvey shares by browser family (all platforms): Chrome 0%, Safari 0%, Firefox 0%, Edge 0%. |
| `WEBGL_shader_pixel_local_storage` | null | null | null | null | 4.66 | No MDN browser-compat-data entry, so browser values could not be read and are null. web3dsurvey desktop shares: Windows 9.83%, macOS 4.66%, Linux 6.85%. web3dsurvey shares by browser family (all platforms): Chrome 9.22%, Safari 0.04%, Firefox 0%, Edge 6.47%. |
| `WEBKIT_WEBGL_compressed_texture_pvrtc` | null | null | null | null | 0 | No MDN browser-compat-data entry, so browser values could not be read and are null. web3dsurvey desktop shares: Windows 0%, macOS 29.73%, Linux 0%. web3dsurvey shares by browser family (all platforms): Chrome 2.44%, Safari 97.27%, Firefox 2.55%, Edge 0.53%. |

## Detail behind the table

First supporting version comes from MDN browser-compat-data. Shares come from web3dsurvey. Browser family shares cover all platforms, phones included. A blank cell means the source has no entry.

| Extension | First Chrome | First Safari | First Firefox | First Edge | Windows % | macOS % | Linux % | Chrome reports % | Safari reports % | Firefox reports % | Edge reports % |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `EXT_color_buffer_float` | 56 | 15 | 51 | 79 | 99.99 | 99.99 | 99.66 | 99.94 | 99.99 | 99.98 | 100 |
| `EXT_color_buffer_half_float` | 63 | 14 | 47 | 17 | 92 | 92.68 | 60.97 | 99.23 | 99.99 | 2.96 | 99.96 |
| `OES_texture_float_linear` | 29 | 8 | 24 | 12 | 99.99 | 88.99 | 97.51 | 94.03 | 61.61 | 96.63 | 99.58 |
| `OES_texture_half_float_linear` | 29 | 8 | 30 | 14 |  |  |  |  |  |  |  |
| `EXT_float_blend` | 75 | 14.1 | 67 | 79 | 99.99 | 89.59 | 99.65 | 98.34 | 62.72 | 98.74 | 99.74 |
| `EXT_texture_filter_anisotropic` | 34 | 9.1 | 47 | 12 | 99.99 | 100 | 99.31 | 99.26 | 100 | 99.75 | 99.97 |
| `EXT_texture_norm16` | 87 | 16 | 159 | 87 | 98 | 98.24 | 68.99 | 90.43 | 99.43 | 78 | 99.43 |
| `EXT_disjoint_timer_query_webgl2` | 70 | no | no | 80 | 85.84 | 61.14 | 43.01 | 79.58 | 0.21 | 0.06 | 94.21 |
| `KHR_parallel_shader_compile` | 76 | 14.1 | no | 79 | 89.92 | 91.15 | 41.2 | 77.51 | 99.08 | 2.55 | 98.02 |
| `OES_draw_buffers_indexed` | 100 | 16 | 108 | 100 | 99.94 | 99.98 | 97.18 | 98.44 | 99.99 | 99.93 | 99.91 |
| `OVR_multiview2` | 93 | no | 71 | 93 | 99.47 | 0.76 | 36.71 | 57.4 | 0.75 | 60.66 | 94.15 |
| `WEBGL_multi_draw` | 86 | 15 | no | 86 | 92.01 | 92.68 | 61.39 | 99.96 | 99.99 | 2.9 | 99.98 |
| `WEBGL_lose_context` | 26 | 8 | 22 | 17 | 100 | 99.99 | 99.51 | 99.96 | 100 | 99.97 | 100 |
| `WEBGL_debug_renderer_info` | 33 | 9.1 | 53 | 12 | 99.99 | 100 | 99.89 | 100 | 100 | 99.9 | 100 |
| `WEBGL_debug_shaders` | 47 | 14 | 56 | 79 | 99.7 | 99.81 | 98.35 | 99.68 | 100 | 99.1 | 99.95 |
| `WEBGL_compressed_texture_s3tc` | 26 | 8 | 22 | 12 | 99.95 | 88.97 | 94.62 | 87.76 | 61.55 | 89.97 | 99.07 |
| `WEBGL_compressed_texture_s3tc_srgb` | 60 | 14.1 | 55 | 80 | 99.96 | 89.5 | 94.28 | 87.57 | 62.71 | 89.55 | 98.98 |
| `EXT_texture_compression_bptc` | 93 | 16 | 68 | 93 | 99.71 | 85.86 | 93.11 | 86.15 | 62.4 | 81.65 | 98.79 |
| `EXT_texture_compression_rgtc` | 93 | 14.1 | 65 | 93 | 99.96 | 89.49 | 93.83 | 87.05 | 62.71 | 89.41 | 98.98 |
| `WEBGL_compressed_texture_etc` | 63 | 13.1 | 55 | 79 | 1.98 | 87.72 | 91.28 | 49.26 | 98.04 | 38.78 | 6.2 |
| `WEBGL_compressed_texture_etc1` | 49 | 13.1 | 55 | 79 | 1.96 | 87.72 | 54.01 | 49.26 | 98.04 | 15.87 | 6.2 |
| `WEBGL_compressed_texture_astc` | 47 | 12 | 53 | 79 | 1.98 | 92.12 | 82.6 | 49.05 | 98.04 | 45.19 | 6.2 |
| `WEBGL_compressed_texture_pvrtc` | 124 | 7 | no | 124 | 0.03 | 87 | 0 | 21.83 | 97.32 | 2.55 | 3.95 |
| `EXT_clip_control` | 122 | 17.4 | 159 | 122 | 98.88 | 96.05 | 79.47 | 94.85 | 98.84 | 76.32 | 99.56 |
| `EXT_depth_clamp` | 121 | 17.4 | 130 | 121 | 99.13 | 99.36 | 91.81 | 88.51 | 99.07 | 86.65 | 98.98 |
| `EXT_polygon_offset_clamp` | 122 | 17.4 | 158 | 122 | 98.88 | 95.94 | 80.93 | 93.61 | 98.87 | 75.72 | 99.33 |
| `WEBGL_clip_cull_distance` |  |  |  |  | 91.89 | 92.14 | 53.97 | 84.52 | 99.23 | 2.88 | 99.26 |
| `WEBGL_polygon_mode` | 121 | 17.4 | no | 121 | 91.85 | 92.07 | 31.91 | 81.42 | 99.06 | 2.88 | 98.29 |
| `WEBGL_provoking_vertex` |  |  |  |  | 97.84 | 99.13 | 14.79 | 72.72 | 99.22 | 63.67 | 97.79 |
| `EXT_conservative_depth` | 122 | 17.5 | no | 122 | 91.61 | 91.16 | 51.96 | 83.64 | 98.57 | 2.87 | 98.32 |
| `EXT_render_snorm` | 126 | 18 | no | 126 | 89.6 | 90.41 | 40.54 | 84.66 | 96.31 | 2.54 | 98.18 |
| `WEBGL_render_shared_exponent` | 124 | 18 | no | 124 | 0.03 | 85.97 | 2.03 | 25.29 | 94.78 | 2.53 | 4.53 |
| `WEBGL_stencil_texturing` | 124 | 18 | no | 124 | 91.49 | 90.47 | 57.45 | 97.6 | 96.97 | 2.87 | 99.55 |
| `WEBGL_blend_func_extended` | 122 | 18 | no | 122 |  |  |  |  |  |  |  |
| `NV_shader_noperspective_interpolation` | 122 | 17.5 | no | 122 | 91.82 | 91.94 | 55.25 | 90.59 | 98.8 | 2.88 | 99.22 |
| `EXT_texture_mirror_clamp_to_edge` | 124 | 18 | 160 | 124 | 98.55 | 95.79 | 75.26 | 87.87 | 96.99 | 68.66 | 98.84 |
| `WEBGL_draw_instanced_base_vertex_base_instance` |  |  |  |  | 0.25 | 0.27 | 0.02 | 0.25 | 0.09 | 0 | 0.18 |
| `WEBGL_multi_draw_instanced_base_vertex_base_instance` |  |  |  |  | 0.23 | 0.26 | 0.01 | 0.24 | 0.06 | 0 | 0.16 |
| `OES_sample_variables` | 126 | 18 | no | 126 | 91.13 | 90.45 | 57.18 | 97.4 | 96.94 | 2.87 | 99.06 |
| `OES_shader_multisample_interpolation` | 126 | 18 | no | 126 | 91.13 | 90.41 | 56.96 | 97.36 | 96.92 | 2.87 | 99.05 |
| `EXT_blend_func_extended` |  |  |  |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `WEBGL_blend_equation_advanced_coherent` |  |  |  |  | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `WEBGL_shader_pixel_local_storage` |  |  |  |  | 9.83 | 4.66 | 6.85 | 9.22 | 0.04 | 0 | 6.47 |
| `WEBKIT_WEBGL_compressed_texture_pvrtc` |  |  |  |  | 0 | 29.73 | 0 | 2.44 | 97.27 | 2.55 | 0.53 |

## Names not covered

MDN browser-compat-data also has entries for these extension interfaces. They are left out because the web3dsurvey WebGL2 extension list does not include them: `ANGLE_instanced_arrays`, `EXT_blend_minmax`, `EXT_disjoint_timer_query`, `EXT_frag_depth`, `EXT_sRGB`, `EXT_shader_texture_lod`, `OES_element_index_uint`, `OES_fbo_render_mipmap`, `OES_standard_derivatives`, `OES_texture_float`, `OES_texture_half_float`, `OES_vertex_array_object`, `WEBGL_color_buffer_float`, `WEBGL_depth_texture`, `WEBGL_draw_buffers`.

## Sources

All read on 2026-11-25.

- https://api.github.com/repos/mdn/browser-compat-data/git/trees/main (GitHub listing of the mdn/browser-compat-data repo at commit tree ec2734641141768c940bea778e9f29ef1e033ab9, used to find the api folder)
- https://api.github.com/repos/mdn/browser-compat-data/git/trees/e0ec83a5a99fdf7bf0c3e9ecfc16791297f670da (GitHub listing of every file in the api folder of mdn/browser-compat-data, used to confirm which WebGL extension interfaces have a compatibility entry and which have none)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/browsers/chrome.json (MDN browser-compat-data release list for Chrome. Current desktop version read from it: 158)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/browsers/safari.json (MDN browser-compat-data release list for Safari. Current desktop version read from it: 27.2)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/browsers/firefox.json (MDN browser-compat-data release list for Firefox. Current desktop version read from it: 160)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/browsers/edge.json (MDN browser-compat-data release list for Edge. Current desktop version read from it: 158)
- https://web3dsurvey.com/webgl2 (web3dsurvey list of WebGL2 extensions with overall share of reports that expose each one)
- https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Using_Extensions (MDN list of WebGL extensions, used to check extension names)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_color_buffer_float.json (MDN browser-compat-data entry for EXT_color_buffer_float, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_float (MDN page for EXT_color_buffer_float, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/EXT_color_buffer_float (web3dsurvey page for EXT_color_buffer_float in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_color_buffer_half_float.json (MDN browser-compat-data entry for EXT_color_buffer_half_float, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_half_float (MDN page for EXT_color_buffer_half_float, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/EXT_color_buffer_half_float (web3dsurvey page for EXT_color_buffer_half_float in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/OES_texture_float_linear.json (MDN browser-compat-data entry for OES_texture_float_linear, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_float_linear (MDN page for OES_texture_float_linear, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/OES_texture_float_linear (web3dsurvey page for OES_texture_float_linear in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/OES_texture_half_float_linear.json (MDN browser-compat-data entry for OES_texture_half_float_linear, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_half_float_linear (MDN page for OES_texture_half_float_linear, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_float_blend.json (MDN browser-compat-data entry for EXT_float_blend, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/EXT_float_blend (MDN page for EXT_float_blend, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/EXT_float_blend (web3dsurvey page for EXT_float_blend in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_texture_filter_anisotropic.json (MDN browser-compat-data entry for EXT_texture_filter_anisotropic, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/EXT_texture_filter_anisotropic (MDN page for EXT_texture_filter_anisotropic, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/EXT_texture_filter_anisotropic (web3dsurvey page for EXT_texture_filter_anisotropic in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_texture_norm16.json (MDN browser-compat-data entry for EXT_texture_norm16, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/EXT_texture_norm16 (MDN page for EXT_texture_norm16, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/EXT_texture_norm16 (web3dsurvey page for EXT_texture_norm16 in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_disjoint_timer_query_webgl2.json (MDN browser-compat-data entry for EXT_disjoint_timer_query_webgl2, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/EXT_disjoint_timer_query_webgl2 (web3dsurvey page for EXT_disjoint_timer_query_webgl2 in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/KHR_parallel_shader_compile.json (MDN browser-compat-data entry for KHR_parallel_shader_compile, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/KHR_parallel_shader_compile (MDN page for KHR_parallel_shader_compile, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/KHR_parallel_shader_compile (web3dsurvey page for KHR_parallel_shader_compile in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/OES_draw_buffers_indexed.json (MDN browser-compat-data entry for OES_draw_buffers_indexed, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/OES_draw_buffers_indexed (MDN page for OES_draw_buffers_indexed, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/OES_draw_buffers_indexed (web3dsurvey page for OES_draw_buffers_indexed in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/OVR_multiview2.json (MDN browser-compat-data entry for OVR_multiview2, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/OVR_multiview2 (MDN page for OVR_multiview2, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/OVR_multiview2 (web3dsurvey page for OVR_multiview2 in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_multi_draw.json (MDN browser-compat-data entry for WEBGL_multi_draw, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_multi_draw (MDN page for WEBGL_multi_draw, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_multi_draw (web3dsurvey page for WEBGL_multi_draw in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_lose_context.json (MDN browser-compat-data entry for WEBGL_lose_context, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_lose_context (MDN page for WEBGL_lose_context, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_lose_context (web3dsurvey page for WEBGL_lose_context in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_debug_renderer_info.json (MDN browser-compat-data entry for WEBGL_debug_renderer_info, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info (MDN page for WEBGL_debug_renderer_info, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_debug_renderer_info (web3dsurvey page for WEBGL_debug_renderer_info in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_debug_shaders.json (MDN browser-compat-data entry for WEBGL_debug_shaders, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_shaders (MDN page for WEBGL_debug_shaders, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_debug_shaders (web3dsurvey page for WEBGL_debug_shaders in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_compressed_texture_s3tc.json (MDN browser-compat-data entry for WEBGL_compressed_texture_s3tc, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_s3tc (MDN page for WEBGL_compressed_texture_s3tc, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_compressed_texture_s3tc (web3dsurvey page for WEBGL_compressed_texture_s3tc in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_compressed_texture_s3tc_srgb.json (MDN browser-compat-data entry for WEBGL_compressed_texture_s3tc_srgb, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_s3tc_srgb (MDN page for WEBGL_compressed_texture_s3tc_srgb, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_compressed_texture_s3tc_srgb (web3dsurvey page for WEBGL_compressed_texture_s3tc_srgb in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_texture_compression_bptc.json (MDN browser-compat-data entry for EXT_texture_compression_bptc, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/EXT_texture_compression_bptc (MDN page for EXT_texture_compression_bptc, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/EXT_texture_compression_bptc (web3dsurvey page for EXT_texture_compression_bptc in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_texture_compression_rgtc.json (MDN browser-compat-data entry for EXT_texture_compression_rgtc, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/EXT_texture_compression_rgtc (MDN page for EXT_texture_compression_rgtc, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/EXT_texture_compression_rgtc (web3dsurvey page for EXT_texture_compression_rgtc in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_compressed_texture_etc.json (MDN browser-compat-data entry for WEBGL_compressed_texture_etc, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_etc (MDN page for WEBGL_compressed_texture_etc, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_compressed_texture_etc (web3dsurvey page for WEBGL_compressed_texture_etc in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_compressed_texture_etc1.json (MDN browser-compat-data entry for WEBGL_compressed_texture_etc1, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_etc1 (MDN page for WEBGL_compressed_texture_etc1, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_compressed_texture_etc1 (web3dsurvey page for WEBGL_compressed_texture_etc1 in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_compressed_texture_astc.json (MDN browser-compat-data entry for WEBGL_compressed_texture_astc, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_astc (MDN page for WEBGL_compressed_texture_astc, used for its note on which WebGL context versions offer the extension. Page last modified Nov 9 2026)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_compressed_texture_astc (web3dsurvey page for WEBGL_compressed_texture_astc in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_compressed_texture_pvrtc.json (MDN browser-compat-data entry for WEBGL_compressed_texture_pvrtc, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_pvrtc (MDN page for WEBGL_compressed_texture_pvrtc, used for its note on which WebGL context versions offer the extension. Page last modified Oct 30 2026)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_compressed_texture_pvrtc (web3dsurvey page for WEBGL_compressed_texture_pvrtc in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_clip_control.json (MDN browser-compat-data entry for EXT_clip_control, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/EXT_clip_control (web3dsurvey page for EXT_clip_control in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_depth_clamp.json (MDN browser-compat-data entry for EXT_depth_clamp, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/EXT_depth_clamp (web3dsurvey page for EXT_depth_clamp in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_polygon_offset_clamp.json (MDN browser-compat-data entry for EXT_polygon_offset_clamp, first supporting version per browser)
- https://developer.mozilla.org/en-US/docs/Web/API/EXT_polygon_offset_clamp (MDN page for EXT_polygon_offset_clamp, used for its note on which WebGL context versions offer the extension. Page last modified Nov 9 2026)
- https://web3dsurvey.com/webgl2/extensions/EXT_polygon_offset_clamp (web3dsurvey page for EXT_polygon_offset_clamp in WebGL2, share of reports by platform and by browser family)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_clip_cull_distance (web3dsurvey page for WEBGL_clip_cull_distance in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_polygon_mode.json (MDN browser-compat-data entry for WEBGL_polygon_mode, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_polygon_mode (web3dsurvey page for WEBGL_polygon_mode in WebGL2, share of reports by platform and by browser family)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_provoking_vertex (web3dsurvey page for WEBGL_provoking_vertex in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_conservative_depth.json (MDN browser-compat-data entry for EXT_conservative_depth, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/EXT_conservative_depth (web3dsurvey page for EXT_conservative_depth in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_render_snorm.json (MDN browser-compat-data entry for EXT_render_snorm, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/EXT_render_snorm (web3dsurvey page for EXT_render_snorm in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_render_shared_exponent.json (MDN browser-compat-data entry for WEBGL_render_shared_exponent, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_render_shared_exponent (web3dsurvey page for WEBGL_render_shared_exponent in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_stencil_texturing.json (MDN browser-compat-data entry for WEBGL_stencil_texturing, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_stencil_texturing (web3dsurvey page for WEBGL_stencil_texturing in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/WEBGL_blend_func_extended.json (MDN browser-compat-data entry for WEBGL_blend_func_extended, first supporting version per browser)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/NV_shader_noperspective_interpolation.json (MDN browser-compat-data entry for NV_shader_noperspective_interpolation, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/NV_shader_noperspective_interpolation (web3dsurvey page for NV_shader_noperspective_interpolation in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/EXT_texture_mirror_clamp_to_edge.json (MDN browser-compat-data entry for EXT_texture_mirror_clamp_to_edge, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/EXT_texture_mirror_clamp_to_edge (web3dsurvey page for EXT_texture_mirror_clamp_to_edge in WebGL2, share of reports by platform and by browser family)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_draw_instanced_base_vertex_base_instance (web3dsurvey page for WEBGL_draw_instanced_base_vertex_base_instance in WebGL2, share of reports by platform and by browser family)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_multi_draw_instanced_base_vertex_base_instance (web3dsurvey page for WEBGL_multi_draw_instanced_base_vertex_base_instance in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/OES_sample_variables.json (MDN browser-compat-data entry for OES_sample_variables, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/OES_sample_variables (web3dsurvey page for OES_sample_variables in WebGL2, share of reports by platform and by browser family)
- https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/OES_shader_multisample_interpolation.json (MDN browser-compat-data entry for OES_shader_multisample_interpolation, first supporting version per browser)
- https://web3dsurvey.com/webgl2/extensions/OES_shader_multisample_interpolation (web3dsurvey page for OES_shader_multisample_interpolation in WebGL2, share of reports by platform and by browser family)
- https://web3dsurvey.com/webgl2/extensions/EXT_blend_func_extended (web3dsurvey page for EXT_blend_func_extended in WebGL2, share of reports by platform and by browser family)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_blend_equation_advanced_coherent (web3dsurvey page for WEBGL_blend_equation_advanced_coherent in WebGL2, share of reports by platform and by browser family)
- https://web3dsurvey.com/webgl2/extensions/WEBGL_shader_pixel_local_storage (web3dsurvey page for WEBGL_shader_pixel_local_storage in WebGL2, share of reports by platform and by browser family)
- https://web3dsurvey.com/webgl2/extensions/WEBKIT_WEBGL_compressed_texture_pvrtc (web3dsurvey page for WEBKIT_WEBGL_compressed_texture_pvrtc in WebGL2, share of reports by platform and by browser family)
