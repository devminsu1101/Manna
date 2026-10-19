package com.manna.backend.auth;

import java.net.URI;

/**
 * 직접 올린 프로필 사진인지 가린다(D-3618). 사진은 프론트가 Vercel Blob(Public 스토어)에 올리고
 * 그 주소만 `PATCH /me`로 저장한다.
 *
 * - `PATCH /me`는 이 주소만 받는다 — 아무 외부 주소나 저장하게 두면 남의 화면에 임의 이미지를 띄울 수 있다.
 * - 로그인(OAuthUserService)은 저장된 사진이 이 주소면 Google 사진으로 덮어쓰지 않는다.
 */
final class ProfilePhoto {

    /** Public 스토어 주소는 `https://{storeId}.public.blob.vercel-storage.com/{pathname}`이다. */
    private static final String BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

    private ProfilePhoto() {}

    static boolean isUploaded(String url) {
        if (url == null) {
            return false;
        }
        try {
            URI uri = URI.create(url);
            return "https".equals(uri.getScheme())
                && uri.getHost() != null
                && uri.getHost().endsWith(BLOB_HOST_SUFFIX);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
