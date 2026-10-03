package com.manna.backend.common;

import org.springframework.http.HttpStatus;

/**
 * API 에러. ApiExceptionHandler가 공통 규약의 형태로 바꿔 내보낸다(docs/03_API_SPEC.md).
 *
 * <pre>{ "error": { "code": "NOT_FOUND", "message": "..." } }</pre>
 *
 * code는 상태 이름을 그대로 쓴다 — 프론트가 문자열로 분기할 일이 생기면 그때 세분한다.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }

    public static ApiException unauthorized() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
    }
}
