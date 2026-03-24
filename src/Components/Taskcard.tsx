/* eslint-disable prettier/prettier */
import { FiCalendar, FiUser } from "react-icons/fi";
import { BsRobot } from "react-icons/bs";

interface Props {
  title: string;
  desc: string;
  due?: string;
  assignee?: string;
  storyPoints?: number;
  aiSuggested?: boolean;
  onClick?: () => void;
}

export default function TaskCard({
  title,
  desc,
  due,
  assignee,
  storyPoints,
  aiSuggested,
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      className="card p-4 cursor-pointer hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-indigo dark:text-iris leading-snug">{title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          {storyPoints && (
            <span className="text-xs bg-iris/10 text-iris font-semibold rounded px-1.5 py-0.5">
              {storyPoints}pt
            </span>
          )}
          <span className="ai-sparkle text-xs text-iris">AI</span>
        </div>
      </div>

      <p className="text-sm mt-2 text-gray-500 dark:text-gray-400 line-clamp-2">{desc}</p>

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
        {due && (
          <span className="flex items-center gap-1">
            {aiSuggested ? (
              <BsRobot size={11} className="text-iris" />
            ) : (
              <FiCalendar size={11} />
            )}
            <span className={aiSuggested ? "text-iris font-medium" : ""}>
              {new Date(due).toLocaleDateString()}
            </span>
          </span>
        )}
        {assignee && (
          <span className="flex items-center gap-1">
            <FiUser size={11} /> {assignee}
          </span>
        )}
      </div>
    </div>
  );
}
