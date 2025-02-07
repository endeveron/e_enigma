export type Result<T> = {
  data: T | null;
  error: { message: string } | null;
};

export type Status = { success: boolean };
