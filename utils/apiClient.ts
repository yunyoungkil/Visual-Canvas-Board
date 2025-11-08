/**
 * API 클라이언트 관리 유틸리티
 * Gemini API 키 검증 및 클라이언트 인스턴스 생성을 담당합니다.
 */

import { GoogleGenAI } from "@google/genai";

/**
 * API 키 에러 타입
 */
export enum ApiKeyErrorType {
  NOT_FOUND = "NOT_FOUND",
  INVALID = "INVALID",
  BILLING_REQUIRED = "BILLING_REQUIRED",
  UNKNOWN = "UNKNOWN",
}

/**
 * API 키 에러 정보
 */
export interface ApiKeyError {
  type: ApiKeyErrorType;
  message: string;
  originalError?: Error;
}

/**
 * API 키 검증 결과
 */
export interface ApiKeyValidationResult {
  isValid: boolean;
  error?: ApiKeyError;
}

/**
 * 환경 변수에서 API 키를 가져옵니다.
 */
export function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.API_KEY;
}

/**
 * API 키가 설정되어 있는지 확인합니다.
 */
export function hasApiKey(): boolean {
  const apiKey = getApiKey();
  return Boolean(apiKey && apiKey.length > 0);
}

/**
 * API 키를 검증합니다.
 */
export async function validateApiKey(): Promise<ApiKeyValidationResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      isValid: false,
      error: {
        type: ApiKeyErrorType.NOT_FOUND,
        message:
          "GEMINI_API_KEY 환경변수가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 입력하세요.",
      },
    };
  }

  // API 키 형식 기본 검증 (Google API 키는 일반적으로 'AI'로 시작)
  if (!apiKey.startsWith("AI") && apiKey.length < 20) {
    return {
      isValid: false,
      error: {
        type: ApiKeyErrorType.INVALID,
        message: "API 키 형식이 올바르지 않습니다.",
      },
    };
  }

  return { isValid: true };
}

/**
 * Gemini AI 클라이언트 인스턴스를 생성합니다.
 * @throws {Error} API 키가 없거나 유효하지 않은 경우
 */
export async function createGeminiClient(): Promise<GoogleGenAI> {
  const validation = await validateApiKey();

  if (!validation.isValid) {
    throw new Error(validation.error?.message || "API 키가 유효하지 않습니다.");
  }

  const apiKey = getApiKey()!;
  return new GoogleGenAI({ apiKey });
}

/**
 * API 호출 에러를 파싱하여 적절한 에러 타입을 반환합니다.
 */
export function parseApiError(error: any): ApiKeyError {
  const errorMessage = error?.message || error?.toString() || "";

  if (errorMessage.includes("Requested entity was not found")) {
    return {
      type: ApiKeyErrorType.INVALID,
      message:
        "API 키가 유효하지 않거나 찾을 수 없습니다. 새로운 API 키를 선택해주세요.",
      originalError: error,
    };
  }

  if (errorMessage.includes("billed users")) {
    return {
      type: ApiKeyErrorType.BILLING_REQUIRED,
      message:
        "Imagen API는 현재 결제가 설정된 사용자만 이용할 수 있습니다. API 키의 결제 설정을 확인해주세요.",
      originalError: error,
    };
  }

  return {
    type: ApiKeyErrorType.UNKNOWN,
    message: `API 호출 중 오류가 발생했습니다: ${errorMessage}`,
    originalError: error,
  };
}

/**
 * API 호출을 래핑하여 에러 처리를 수행합니다.
 */
export async function withApiErrorHandling<T>(
  apiCall: () => Promise<T>,
  onError?: (error: ApiKeyError) => void
): Promise<T> {
  try {
    return await apiCall();
  } catch (error: any) {
    const apiError = parseApiError(error);
    if (onError) {
      onError(apiError);
    }
    throw error;
  }
}

/**
 * Gemini 모델 이름 상수
 */
export const GEMINI_MODELS = {
  // 텍스트 생성/편집
  FLASH: "gemini-2.5-flash",
  PRO: "gemini-2.5-pro",
  
  // 이미지 생성
  IMAGEN: "imagen-4.0-generate-001",
  
  // 비디오 생성
  VEO: "veo-3.1-fast-generate-preview",
  
  // 멀티모달 (장면 생성)
  FLASH_IMAGE: "gemini-2.5-flash-image",
} as const;

/**
 * 기본 API 설정
 */
export const API_CONFIG = {
  // 생성 온도 (0.0 ~ 2.0, 낮을수록 일관적, 높을수록 창의적)
  TEMPERATURE: {
    CONSERVATIVE: 0.4,
    BALANCED: 0.7,
    CREATIVE: 1.0,
  },
  
  // 최대 토큰 수
  MAX_TOKENS: {
    SHORT: 512,
    MEDIUM: 2048,
    LONG: 8192,
  },
  
  // 재시도 설정
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
  },
} as const;
