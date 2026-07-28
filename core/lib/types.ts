export type ActionResult<T = void> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };
