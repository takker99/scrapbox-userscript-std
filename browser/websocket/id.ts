import { getProject } from "../../rest/project.ts";
import { getProfile } from "../../rest/profile.ts";

/** cached user ID */
let userId: string | undefined;
export const getUserId = async (): Promise<string> => {
  if (userId !== undefined) return userId;

  const user = await getProfile();
  if (user.isGuest) {
    throw new Error("this script can only be executed by Logged in users");
  }
  userId = user.id;
  return userId;
};

/** cached pairs of project name and project id */
const projectMap = new Map<string, string>();
export const getProjectId = async (project: string): Promise<string> => {
  const cachedId = projectMap.get(project);
  if (cachedId !== undefined) return cachedId;

  const result = await getProject(project);
  if (!result.ok) {
    const { name, message } = result.value;
    throw new Error(`${name} ${message}`);
  }
  const { id } = result.value;
  projectMap.set(project, id);
  return id;
};

const zero = (n: string) => n.padStart(8, "0");

export const createNewLineId = (userId: string): string => {
  const time = Math.floor(new Date().getTime() / 1000).toString(16);
  const rand = Math.floor(0xFFFFFE * Math.random()).toString(16);
  return `${zero(time).slice(-8)}${userId.slice(-6)}0000${zero(rand)}`;
};
export const getUnixTimeFromId = (id: string): number => {
  if (!isId(id)) throw SyntaxError(`"${id}" is an invalid id.`);

  return parseInt(`0x${id.slice(0, 8)}`, 16);
};
export const isId = (id: string): boolean => /^[a-f\d]{24,32}$/.test(id);
