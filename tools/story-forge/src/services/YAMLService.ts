/**
 * YAML Service
 * Bidirectional conversion between node graphs and YAML scenario files
 */

import { stringify, parse } from 'yaml';
import type { NodeGraph, BaseNode, DialogueNode as DialogueNodeData, ChoiceNode as ChoiceNodeData, ConditionNode as ConditionNodeData, EffectNode as EffectNodeData, Connection } from '../types/index.js';

export interface YAMLDialogueEvent {
  time: number;
  type: string;
  speaker: string;
  text: string;
  emotion?: string;
  choices?: YAMLChoice[];
  condition?: any;
  effects?: any[];
}

export interface YAMLChoice {
  text: string;
  mask?: string;
  energyCost?: number;
  stressCost?: number;
  consequence?: string;
  effects?: any[];
}

export class YAMLService {
  /**
   * Convert node graph to YAML scenario format
   */
  graphToYAML(graph: NodeGraph): string {
    const events = this.graphToEvents(graph);

    const scenario = {
      metadata: {
        title: graph.metadata.title || 'Untitled Scenario',
        tags: graph.metadata.tags || [],
      },
      events: events,
    };

    return stringify(scenario, {
      indent: 2,
      lineWidth: 100,
    });
  }

  /**
   * Convert node graph to event array
   */
  private graphToEvents(graph: NodeGraph): YAMLDialogueEvent[] {
    const events: YAMLDialogueEvent[] = [];
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
    const connectionMap = this.buildConnectionMap(graph.connections);

    // Find entry node
    const entryNode = graph.nodes.find(n => n.id === graph.metadata.entryNodeId) || graph.nodes[0];
    if (!entryNode) return events;

    // Traverse graph starting from entry node
    let currentNodeId: string | null = entryNode.id;
    let eventIndex = 0;

    const visited = new Set<string>();

    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId);

      const node = nodeMap.get(currentNodeId);
      if (!node) break;

      const event = this.nodeToEvent(node, eventIndex, nodeMap, connectionMap);
      if (event) {
        events.push(event);
        eventIndex += 2; // Increment by 2 minutes for spacing
      }

      // Move to next node
      currentNodeId = this.getNextNodeId(node, connectionMap);
    }

    return events;
  }

  /**
   * Convert a single node to a YAML event
   */
  private nodeToEvent(
    node: BaseNode,
    time: number,
    nodeMap: Map<string, BaseNode>,
    connectionMap: Map<string, string>
  ): YAMLDialogueEvent | null {
    switch (node.type) {
      case 'dialogue':
        return this.dialogueNodeToEvent(node as DialogueNodeData, time);

      case 'choice':
        return this.choiceNodeToEvent(node as ChoiceNodeData, time, nodeMap, connectionMap);

      case 'condition':
        return this.conditionNodeToEvent(node as ConditionNodeData, time, nodeMap, connectionMap);

      case 'effect':
        // Effects are typically merged into choices, not standalone events
        return null;

      default:
        return null;
    }
  }

  /**
   * Convert DialogueNode to YAML event
   */
  private dialogueNodeToEvent(node: DialogueNodeData, time: number): YAMLDialogueEvent {
    return {
      time,
      type: 'dialogue',
      speaker: node.speaker,
      text: node.text,
      emotion: node.emotion !== 'neutral' ? node.emotion : undefined,
    };
  }

  /**
   * Convert ChoiceNode to YAML event
   */
  private choiceNodeToEvent(
    node: ChoiceNodeData,
    time: number,
    nodeMap: Map<string, BaseNode>,
    connectionMap: Map<string, string>
  ): YAMLDialogueEvent {
    const choices: YAMLChoice[] = node.options.map(option => {
      const choice: YAMLChoice = {
        text: option.text,
        mask: option.mask,
        effects: option.effects.length > 0 ? option.effects : undefined,
      };

      // Check if this choice leads to an effect node
      const targetNodeId = connectionMap.get(option.outputPortId);
      if (targetNodeId) {
        const targetNode = nodeMap.get(targetNodeId);
        if (targetNode && targetNode.type === 'effect') {
          const effectNode = targetNode as EffectNodeData;
          choice.effects = effectNode.effects;

          // Extract energy/stress costs
          effectNode.effects.forEach(effect => {
            if (effect.type === 'stat' && effect.target === 'energy' && effect.operation === '-') {
              choice.energyCost = Math.abs(Number(effect.value));
            }
            if (effect.type === 'stat' && effect.target === 'stress' && effect.operation === '+') {
              choice.stressCost = Math.abs(Number(effect.value));
            }
          });
        }
      }

      return choice;
    });

    return {
      time,
      type: 'question',
      speaker: 'Narrator',
      text: 'Choose an option:',
      choices,
    };
  }

  /**
   * Convert ConditionNode to YAML event
   */
  private conditionNodeToEvent(
    node: ConditionNodeData,
    time: number,
    nodeMap: Map<string, BaseNode>,
    connectionMap: Map<string, string>
  ): YAMLDialogueEvent {
    return {
      time,
      type: 'conditional',
      speaker: 'System',
      text: 'Conditional event',
      condition: node.condition,
    };
  }

  /**
   * Build a map of port ID to target node ID
   */
  private buildConnectionMap(connections: Connection[]): Map<string, string> {
    const map = new Map<string, string>();
    connections.forEach(conn => {
      map.set(conn.sourcePortId, conn.targetNodeId);
    });
    return map;
  }

  /**
   * Get the next node ID from current node's output
   */
  private getNextNodeId(node: BaseNode, connectionMap: Map<string, string>): string | null {
    // For nodes with single output, follow it
    if (node.outputs.length === 1) {
      return connectionMap.get(node.outputs[0].id) || null;
    }

    // For choice/condition nodes, we stop here (handled in event conversion)
    return null;
  }

  /**
   * Parse YAML scenario into node graph
   */
  yamlToGraph(yamlText: string): NodeGraph {
    const data = parse(yamlText);

    if (!data || !data.events) {
      throw new Error('Invalid YAML: missing events');
    }

    const nodes: BaseNode[] = [];
    const connections: Connection[] = [];

    let nodeIdCounter = 1;
    let xPos = 100;
    const yPos = 100;

    // Convert events to nodes
    data.events.forEach((event: any, index: number) => {
      const nodeId = `node-${nodeIdCounter++}`;

      if (event.type === 'dialogue') {
        // Create dialogue node
        const dialogueNode: DialogueNodeData = {
          id: nodeId,
          type: 'dialogue',
          position: { x: xPos, y: yPos },
          speaker: event.speaker || 'Character',
          text: event.text || '',
          emotion: event.emotion || 'neutral',
          inputs: [{ id: `${nodeId}-in`, type: 'flow' }],
          outputs: [{ id: `${nodeId}-out`, type: 'flow' }],
        };

        nodes.push(dialogueNode);

        // Connect to previous node
        if (nodes.length > 1) {
          const prevNode = nodes[nodes.length - 2];
          const prevOutput = prevNode.outputs[0];
          const thisInput = dialogueNode.inputs[0];

          connections.push({
            id: `conn-${connections.length + 1}`,
            sourceNodeId: prevNode.id,
            sourcePortId: prevOutput.id,
            targetNodeId: dialogueNode.id,
            targetPortId: thisInput.id,
          });
        }

        xPos += 250;
      } else if (event.type === 'question' && event.choices) {
        // Create choice node
        const choiceNode: ChoiceNodeData = {
          id: nodeId,
          type: 'choice',
          position: { x: xPos, y: yPos },
          options: event.choices.map((choice: any, choiceIndex: number) => ({
            id: `${nodeId}-opt-${choiceIndex}`,
            text: choice.text || '',
            mask: choice.mask,
            effects: choice.effects || [],
            outputPortId: `${nodeId}-out-${choiceIndex}`,
          })),
          inputs: [{ id: `${nodeId}-in`, type: 'flow' }],
          outputs: [],
        };

        nodes.push(choiceNode);

        // Connect to previous node
        if (nodes.length > 1) {
          const prevNode = nodes[nodes.length - 2];
          const prevOutput = prevNode.outputs[0];
          const thisInput = choiceNode.inputs[0];

          connections.push({
            id: `conn-${connections.length + 1}`,
            sourceNodeId: prevNode.id,
            sourcePortId: prevOutput.id,
            targetNodeId: choiceNode.id,
            targetPortId: thisInput.id,
          });
        }

        xPos += 250;
      } else if (event.condition) {
        // Create condition node
        const conditionNode: ConditionNodeData = {
          id: nodeId,
          type: 'condition',
          position: { x: xPos, y: yPos },
          condition: event.condition,
          trueOutputId: `${nodeId}-true`,
          falseOutputId: `${nodeId}-false`,
          inputs: [{ id: `${nodeId}-in`, type: 'flow' }],
          outputs: [
            { id: `${nodeId}-true`, type: 'flow', label: 'True' },
            { id: `${nodeId}-false`, type: 'flow', label: 'False' },
          ],
        };

        nodes.push(conditionNode);

        // Connect to previous node
        if (nodes.length > 1) {
          const prevNode = nodes[nodes.length - 2];
          const prevOutput = prevNode.outputs[0];
          const thisInput = conditionNode.inputs[0];

          connections.push({
            id: `conn-${connections.length + 1}`,
            sourceNodeId: prevNode.id,
            sourcePortId: prevOutput.id,
            targetNodeId: conditionNode.id,
            targetPortId: thisInput.id,
          });
        }

        xPos += 250;
      }
    });

    return {
      nodes,
      connections,
      metadata: {
        entryNodeId: nodes[0]?.id || '',
        title: data.metadata?.title || 'Imported Scenario',
        tags: data.metadata?.tags || [],
      },
    };
  }

  /**
   * Convert full day scenario YAML to node graph
   * Handles meetings with events
   */
  dayScenarioToGraph(yamlText: string): NodeGraph {
    const data = parse(yamlText);

    if (!data) {
      throw new Error('Invalid YAML');
    }

    // For now, focus on meetings if they exist
    if (data.meetings && data.meetings.length > 0) {
      const firstMeeting = data.meetings[0];
      if (firstMeeting.events) {
        // Convert meeting events to graph
        return this.meetingEventsToGraph(firstMeeting);
      }
    }

    // Fallback to events if they exist
    if (data.events) {
      return this.yamlToGraph(yamlText);
    }

    throw new Error('No convertible content found in YAML');
  }

  /**
   * Convert meeting events to node graph
   */
  private meetingEventsToGraph(meeting: any): NodeGraph {
    const nodes: BaseNode[] = [];
    const connections: Connection[] = [];

    let nodeIdCounter = 1;
    let xPos = 100;
    const yPos = 100;

    meeting.events.forEach((event: any, index: number) => {
      const nodeId = `node-${nodeIdCounter++}`;

      // Create dialogue node for the question/statement
      const dialogueNode: DialogueNodeData = {
        id: nodeId,
        type: 'dialogue',
        position: { x: xPos, y: yPos },
        speaker: event.speaker || 'Character',
        text: event.text || '',
        emotion: 'neutral',
        inputs: [{ id: `${nodeId}-in`, type: 'flow' }],
        outputs: [{ id: `${nodeId}-out`, type: 'flow' }],
      };

      nodes.push(dialogueNode);

      // Connect to previous node
      if (nodes.length > 1) {
        const prevNode = nodes[nodes.length - 2];
        const prevOutput = prevNode.outputs[prevNode.outputs.length - 1];
        const thisInput = dialogueNode.inputs[0];

        connections.push({
          id: `conn-${connections.length + 1}`,
          sourceNodeId: prevNode.id,
          sourcePortId: prevOutput.id,
          targetNodeId: dialogueNode.id,
          targetPortId: thisInput.id,
        });
      }

      xPos += 250;

      // If this event has choices, create a choice node
      if (event.choices && event.choices.length > 0) {
        const choiceNodeId = `node-${nodeIdCounter++}`;

        const choiceNode: ChoiceNodeData = {
          id: choiceNodeId,
          type: 'choice',
          position: { x: xPos, y: yPos },
          options: event.choices.map((choice: any, choiceIndex: number) => ({
            id: `${choiceNodeId}-opt-${choiceIndex}`,
            text: choice.text || '',
            mask: choice.mask,
            effects: choice.energyCost || choice.stressCost ? [
              ...(choice.energyCost ? [{
                type: 'stat' as const,
                target: 'energy',
                operation: '-' as const,
                value: choice.energyCost,
              }] : []),
              ...(choice.stressCost ? [{
                type: 'stat' as const,
                target: 'stress',
                operation: '+' as const,
                value: choice.stressCost,
              }] : []),
            ] : [],
            outputPortId: `${choiceNodeId}-out-${choiceIndex}`,
          })),
          inputs: [{ id: `${choiceNodeId}-in`, type: 'flow' }],
          outputs: [],
        };

        nodes.push(choiceNode);

        // Connect dialogue to choice
        connections.push({
          id: `conn-${connections.length + 1}`,
          sourceNodeId: dialogueNode.id,
          sourcePortId: dialogueNode.outputs[0].id,
          targetNodeId: choiceNode.id,
          targetPortId: choiceNode.inputs[0].id,
        });

        xPos += 250;
      }
    });

    return {
      nodes,
      connections,
      metadata: {
        entryNodeId: nodes[0]?.id || '',
        title: meeting.title || 'Meeting',
        tags: [],
      },
    };
  }

  /**
   * Validate YAML syntax
   */
  validateYAML(yamlText: string): { valid: boolean; error?: string } {
    try {
      parse(yamlText);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const yamlService = new YAMLService();
