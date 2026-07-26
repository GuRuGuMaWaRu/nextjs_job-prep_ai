jest.mock("next/cache", () => {
  const { createNextCacheMock } = jest.requireActual<
    typeof import("@core/test-utils/mocks/next")
  >("@core/test-utils/mocks/next");
  return createNextCacheMock();
});

import { updateTag } from "next/cache";

import {
  getInterviewGlobalTag,
  getInterviewIdTag,
  getInterviewJobInfoTag,
  revalidateInterviewCache,
} from "./dbCache";

const mockUpdateTag = jest.mocked(updateTag);

describe("revalidateInterviewCache", () => {
  beforeEach(() => {
    mockUpdateTag.mockClear();
  });

  it("expires interview tags immediately for read-your-own-writes", () => {
    const id = "interview-1";
    const jobInfoId = "job-1";

    revalidateInterviewCache({ id, jobInfoId });

    expect(mockUpdateTag).toHaveBeenCalledTimes(3);
    expect(mockUpdateTag).toHaveBeenCalledWith(getInterviewGlobalTag());
    expect(mockUpdateTag).toHaveBeenCalledWith(
      getInterviewJobInfoTag(jobInfoId),
    );
    expect(mockUpdateTag).toHaveBeenCalledWith(getInterviewIdTag(id));
  });
});
