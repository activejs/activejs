/**
 * Common configuration options, applicable to all the fundamental ActiveJS constructs,
 * Units, Systems, Action and Cluster.
 *
 * @category Common
 */
export interface BaseConfig {
  /**
   * A unique id to identify Units, Actions, Systems, Clusters. \
   * It's required for a Unit to be persistent.
   *
   * Note: If the provided id is not null or undefined, it should be a non-empty string,
   * otherwise an error will be thrown.
   *
   * @default `undefined`
   */
  id?: string;

  /**
   * A flag to control the replay behaviour of a Unit, System, Action or Cluster. \
   * It decides whether the value should be replayed when you subscribe to the ActiveJS construct.
   *
   * @default
   * Units: `true` \
   * Systems: `true` \
   * Clusters: `true` \
   * Actions: `false`
   */
  replay?: boolean;
}
