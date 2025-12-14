"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";

import {
  JobInfoTable,
  questionDifficulties,
  QuestionDifficulty,
} from "@/core/drizzle/schema";
import { BackLink } from "@/core/components/BackLink";
import { Button } from "@/core/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/core/components/ui/resizable";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { Textarea } from "@/core/components/ui/textarea";
import { MarkdownRenderer } from "@/core/components/MarkdownRenderer";
import { LoadingSwap } from "@/core/components/ui/loading-swap";
import { formatQuestionDifficulty } from "@/core/features/questions/formatters";
import { errorToast } from "@/core/lib/errorToast";

type Status = "awaiting-answer" | "awaiting-difficulty" | "init";

export function NewQuestionClientPage({
  jobInfo,
}: {
  jobInfo: Pick<typeof JobInfoTable.$inferSelect, "id" | "title" | "name">;
}) {
  const [status, setStatus] = useState<Status>("init");
  const [answer, setAnswer] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);

  const { complete: generateQuestion, isLoading: isGeneratingQuestion } =
    useCompletion({
      api: "/api/ai/questions/generate-question",
      onFinish: async (_, completion) => {
        const [question, questionId] = completion.split("Question ID: ");
        setQuestionId(questionId);
        setQuestion(question);
        setStatus("awaiting-answer");
      },
      onError: (error) => {
        console.error(error);
        errorToast(error.message);
      },
    });

  const {
    complete: generateFeedback,
    completion: feedback,
    setCompletion: setFeedback,
    isLoading: isGeneratingFeedback,
  } = useCompletion({
    api: "/api/ai/questions/generate-feedback",
    onFinish: () => {
      setStatus("awaiting-difficulty");
    },
    onError: (error) => {
      console.error(error);
      errorToast(error.message);
    },
  });

  return (
    <div className="flex flex-col gap-4 items-center grow h-screen-header w-full mx-auto max-w-[2000px]">
      <div className="container flex gap-4 mt-4 items-center">
        <div className="grow basis-0">
          <BackLink href={`/app/job-infos/${jobInfo.id}`}>
            Back to {jobInfo.name}
          </BackLink>
        </div>
        <Controls
          answerBtnDisabled={
            answer == null || answer.trim() === "" || questionId == null
          }
          isLoading={isGeneratingQuestion || isGeneratingFeedback}
          status={status}
          generateQuestion={(difficulty) => {
            setQuestion("");
            setFeedback("");
            setAnswer(null);
            generateQuestion(difficulty, { body: { jobInfoId: jobInfo.id } });
          }}
          generateFeedback={() => {
            if (answer == null || answer.trim() === "" || questionId == null) {
              return;
            }

            generateFeedback(answer?.trim(), {
              body: { questionId },
            });
          }}
          reset={() => {
            setStatus("init");
            setQuestion("");
            setFeedback("");
            setAnswer(null);
          }}
        />
        <div className="grow hidden md:block" />
      </div>
      <QuestionContainer
        question={question}
        feedback={feedback}
        answer={answer}
        status={status}
        setAnswer={setAnswer}
      />
    </div>
  );
}

function QuestionContainer({
  question,
  feedback,
  answer,
  status,
  setAnswer,
}: {
  question: string | null;
  feedback: string | null;
  answer: string | null;
  status: Status;
  setAnswer: (answer: string) => void;
}) {
  return (
    <ResizablePanelGroup direction="horizontal" className="grow border-t">
      <ResizablePanel id="question-and-feedback" defaultSize={50} minSize={5}>
        <ResizablePanelGroup direction="vertical" className="grow">
          <ResizablePanel id="question" defaultSize={25} minSize={5}>
            <ScrollArea className="h-full min-w-48 ">
              {status === "init" && question == null ? (
                <p className="md:text-lg flex items-center justify-center h-full p-6">
                  Get started by selecting a question difficulty above.
                </p>
              ) : question ? (
                <MarkdownRenderer className="p-6">{question}</MarkdownRenderer>
              ) : null}
            </ScrollArea>
          </ResizablePanel>
          {feedback ? (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel id="feedback" defaultSize={75} minSize={5}>
                <ScrollArea className="h-full min-w-48">
                  <MarkdownRenderer className="p-6">
                    {feedback}
                  </MarkdownRenderer>
                </ScrollArea>
              </ResizablePanel>
            </>
          ) : null}
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel id="answer" defaultSize={50} minSize={5}>
        <ScrollArea className="h-full min-w-48">
          <Textarea
            placeholder="Type your answer here..."
            className="w-full h-full resize-none rounded-none focus-visible:ring focus-visible:ring-inset text-base! p-6"
            value={answer ?? ""}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={status !== "awaiting-answer"}
          />
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function Controls({
  answerBtnDisabled,
  isLoading,
  status,
  generateQuestion,
  generateFeedback,
  reset,
}: {
  answerBtnDisabled: boolean;
  isLoading: boolean;
  status: Status;
  generateQuestion: (difficulty: QuestionDifficulty) => void;
  generateFeedback: () => void;
  reset: () => void;
}) {
  return (
    <div className="flex gap-2">
      {status === "awaiting-answer" ? (
        <>
          <Button
            variant="outline"
            onClick={reset}
            disabled={isLoading}
            size="sm">
            <LoadingSwap isLoading={isLoading}>Skip</LoadingSwap>
          </Button>
          <Button
            onClick={generateFeedback}
            disabled={answerBtnDisabled}
            size="sm">
            <LoadingSwap isLoading={isLoading}>Answer</LoadingSwap>
          </Button>
        </>
      ) : (
        questionDifficulties.map((difficulty) => (
          <Button
            key={difficulty}
            disabled={isLoading}
            onClick={() => {
              generateQuestion(difficulty);
            }}>
            <LoadingSwap isLoading={isLoading}>
              {formatQuestionDifficulty(difficulty)}
            </LoadingSwap>
          </Button>
        ))
      )}
    </div>
  );
}
