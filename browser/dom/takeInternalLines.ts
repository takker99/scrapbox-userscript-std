import { lines } from "./dom.ts";
import type { BaseLine } from "@cosense/types/userscript";

/** Get a reference to Scrapbox's internal page content data
 *
 * This function provides direct access to the page content without deep cloning,
 * unlike `scrapbox.Page.lines` which creates a deep copy. Use this when:
 * - You need better performance by avoiding data cloning
 * - You only need to read the raw line data
 *
 * Important Notes:
 * - This returns a direct reference to the internal data. While the type definition
 *   marks it as readonly, the content can still be modified through JavaScript.
 *   Be careful not to modify the data to avoid unexpected behavior.
 * - Unlike `scrapbox.Page.lines`, the returned data does not include parsed
 *   syntax information (no syntax tree or parsed line components).
 *
 * @returns A readonly array of BaseLine objects representing the page content
 */
export const takeInternalLines = (): readonly BaseLine[] => {
  const linesEl = lines();
  if (!linesEl) {
    throw Error(`div.lines is not found.`);
  }

  const reactKey = Object.keys(linesEl)
    .find((key) => key.startsWith("__reactFiber"));
  if (!reactKey) {
    throw Error(
      'div.lines must has the property whose name starts with "__reactFiber"',
    );
  }

  // @ts-ignore Accessing DOM element as an object to reach React's internal data.
  // This is necessary to get the raw line data from React's component props.
  return (linesEl[reactKey] as ReactFiber).return.stateNode.props
    .lines as const;
};

/** Internal React Fiber node structure for accessing line data
 *
 * This interface represents the minimal structure needed to access
 * the lines data from React's component props. This is an implementation
 * detail that depends on React's internal structure.
 */
interface ReactFiber {
  return: {
    stateNode: {
      props: {
        lines: BaseLine[];
      };
    };
  };
}
