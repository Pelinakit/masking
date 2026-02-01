/**
 * PropertyPanel
 * Panel for editing node properties
 */

import { Node } from './Node.js';
import { entityRegistry, type CharacterEntity, type StatEntity } from '../services/EntityRegistry.js';
import type { Emotion, Effect, Condition, ChoiceOption, TriggerMode } from '../types/index.js';

type UpdateCallback = (nodeId: string, updates: Record<string, any>) => void;
type CloseCallback = () => void;

export class PropertyPanel {
  private container: HTMLElement;
  private panel: HTMLElement;
  private currentNode: Node | null = null;
  private updateCallback: UpdateCallback | null = null;
  private closeCallback: CloseCallback | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.panel = document.createElement('div');
    this.panel.className = 'property-panel';
    this.panel.style.display = 'none';
    this.container.appendChild(this.panel);
  }

  /**
   * Register update callback
   */
  onUpdate(callback: UpdateCallback): void {
    this.updateCallback = callback;
  }

  /**
   * Register close callback
   */
  onClose(callback: CloseCallback): void {
    this.closeCallback = callback;
  }

  /**
   * Show panel for a node at a specific position
   */
  show(node: Node, screenPos?: { x: number; y: number }): void {
    this.currentNode = node;
    this.render();
    this.panel.style.display = 'block';

    // Position the panel near the node if position provided
    if (screenPos) {
      const panelWidth = 420;
      const panelHeight = this.panel.offsetHeight || 400;

      // Center horizontally over the node, with some offset
      let left = screenPos.x - panelWidth / 2;
      let top = screenPos.y - 20; // Slight offset above click point

      // Keep panel within viewport bounds
      const margin = 20;
      left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));
      top = Math.max(margin, Math.min(top, window.innerHeight - panelHeight - margin));

      this.panel.style.position = 'fixed';
      this.panel.style.left = `${left}px`;
      this.panel.style.top = `${top}px`;
      this.panel.style.right = 'auto';
    }
  }

  /**
   * Hide panel
   */
  hide(): void {
    this.panel.style.display = 'none';
    this.currentNode = null;
    if (this.closeCallback) {
      this.closeCallback();
    }
  }

  /**
   * Render panel content based on node type
   */
  private render(): void {
    if (!this.currentNode) return;

    const data = this.currentNode.toData();
    let content = '';

    switch (data.type) {
      case 'dialogue':
        content = this.renderDialoguePanel(data as any);
        break;
      case 'choice':
        content = this.renderChoicePanel(data as any);
        break;
      case 'condition':
        content = this.renderConditionPanel(data as any);
        break;
      case 'effect':
        content = this.renderEffectPanel(data as any);
        break;
      case 'email':
        content = this.renderEmailPanel(data as any);
        break;
      case 'meeting':
        content = this.renderMeetingPanel(data as any);
        break;
      case 'task':
        content = this.renderTaskPanel(data as any);
        break;
      case 'message':
        content = this.renderMessagePanel(data as any);
        break;
      default:
        content = '<p>Unknown node type</p>';
    }

    this.panel.innerHTML = `
      <div class="property-panel-header">
        <h3>Edit ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Node</h3>
        <button class="property-panel-close" title="Close (Esc)">&times;</button>
      </div>
      <div class="property-panel-content">
        ${content}
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render dialogue node panel
   */
  private renderDialoguePanel(data: { speaker: string; text: string; emotion: Emotion }): string {
    const emotions: Emotion[] = ['neutral', 'bubbly', 'sad', 'stern', 'angry', 'giggling', 'laughing'];

    return `
      ${this.renderCharacterDropdown('prop-speaker', 'Speaker', data.speaker)}
      <div class="form-group">
        <label for="prop-text">Text</label>
        <textarea id="prop-text" rows="4">${this.escapeHtml(data.text)}</textarea>
      </div>
      <div class="form-group">
        <label for="prop-emotion">Emotion</label>
        <select id="prop-emotion">
          ${emotions.map(e => `<option value="${e}" ${data.emotion === e ? 'selected' : ''}>${e}</option>`).join('')}
        </select>
      </div>
    `;
  }

  /**
   * Render choice node panel
   */
  private renderChoicePanel(data: { options: ChoiceOption[] }): string {
    return `
      <div class="form-group">
        <label>Choice Options</label>
        <div id="choice-options-list">
          ${data.options.map((opt, i) => this.renderChoiceOption(opt, i)).join('')}
        </div>
        <button class="button button-secondary" id="add-choice-btn" style="margin-top: 8px;">+ Add Option</button>
      </div>
    `;
  }

  /**
   * Render a single choice option
   */
  private renderChoiceOption(option: ChoiceOption, index: number): string {
    return `
      <div class="choice-option" data-index="${index}">
        <div class="choice-option-header">
          <span>Option ${index + 1}</span>
          <button class="remove-option-btn" data-index="${index}" title="Remove">&times;</button>
        </div>
        <input type="text" class="choice-text" data-index="${index}" value="${this.escapeHtml(option.text)}" placeholder="Choice text..." />
        <div class="choice-effects">
          ${this.renderEffectsEditor(option.effects || [], `choice-${index}`)}
        </div>
      </div>
    `;
  }

  /**
   * Render condition node panel
   */
  private renderConditionPanel(data: { condition: Condition }): string {
    const types = ['stat', 'relationship', 'flag', 'item', 'time'];
    const operators = ['>', '<', '>=', '<=', '==', '!='];
    const stats = entityRegistry.getStats();
    const characters = entityRegistry.getCharacters();
    const condType = data.condition.type || 'stat';

    return `
      <div class="form-group">
        <label for="prop-cond-type">Condition Type</label>
        <select id="prop-cond-type">
          ${types.map(t => `<option value="${t}" ${condType === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" id="cond-target-group">
        <label for="prop-cond-target">Target</label>
        <div class="entity-dropdown-row">
          ${condType === 'stat' ? `
            <select id="prop-cond-target" class="entity-dropdown">
              <option value="">-- Select Stat --</option>
              ${stats.map(s => `<option value="${s.id}" ${data.condition.target === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
          ` : condType === 'relationship' ? `
            <select id="prop-cond-target" class="entity-dropdown">
              <option value="">-- Select Character --</option>
              ${characters.map(c => `<option value="${c.id}" ${data.condition.target === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          ` : `
            <input type="text" id="prop-cond-target" value="${this.escapeHtml(data.condition.target || '')}" placeholder="e.g., flag_name" />
          `}
        </div>
      </div>
      <div class="form-group">
        <label for="prop-cond-operator">Operator</label>
        <select id="prop-cond-operator">
          ${operators.map(o => `<option value="${o}" ${data.condition.operator === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="prop-cond-value">Value</label>
        <input type="text" id="prop-cond-value" value="${data.condition.value}" />
      </div>
    `;
  }

  /**
   * Render effect node panel
   */
  private renderEffectPanel(data: { effects: Effect[] }): string {
    return `
      <div class="form-group">
        <label>Effects</label>
        <div id="effects-list">
          ${this.renderEffectsEditor(data.effects, 'effect')}
        </div>
        <button class="button button-secondary" id="add-effect-btn" style="margin-top: 8px;">+ Add Effect</button>
      </div>
    `;
  }

  /**
   * Render trigger mode selector
   */
  private renderTriggerModeSelector(currentMode: TriggerMode): string {
    return `
      <div class="form-group">
        <label>Trigger Mode</label>
        <div class="trigger-mode-selector">
          <button class="trigger-mode-btn ${currentMode === 'scheduled' ? 'active' : ''}" data-mode="scheduled">
            ⏰ Scheduled
          </button>
          <button class="trigger-mode-btn ${currentMode === 'conditional' ? 'active' : ''}" data-mode="conditional">
            ➡️ Conditional
          </button>
        </div>
        <span class="form-hint">
          ${currentMode === 'scheduled'
            ? 'Event occurs at the specified time'
            : 'Event occurs when triggered by another node'}
        </span>
      </div>
    `;
  }

  /**
   * Render character dropdown with + button
   */
  private renderCharacterDropdown(fieldId: string, label: string, currentValue: string): string {
    const characters = entityRegistry.getCharacters();
    return `
      <div class="form-group">
        <label for="${fieldId}">${label}</label>
        <select id="${fieldId}" class="entity-dropdown">
          <option value="">-- Select Character --</option>
          ${characters.map(c => `<option value="${c.id}" ${currentValue === c.id || currentValue === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

  /**
   * Render stat dropdown with + button
   */
  private renderStatDropdown(fieldId: string, label: string, currentValue: string): string {
    const stats = entityRegistry.getStats();
    return `
      <div class="form-group">
        <label for="${fieldId}">${label}</label>
        <select id="${fieldId}" class="entity-dropdown">
          <option value="">-- Select Stat --</option>
          ${stats.map(s => `<option value="${s.id}" ${currentValue === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

  /**
   * Render email node panel
   */
  private renderEmailPanel(data: { triggerMode?: TriggerMode; time: string; from: string; subject: string; body: string; urgent: boolean; requiresResponse: boolean }): string {
    const triggerMode = data.triggerMode || 'scheduled';

    return `
      ${this.renderTriggerModeSelector(triggerMode)}
      <div class="form-group time-field" ${triggerMode === 'conditional' ? 'style="opacity: 0.5"' : ''}>
        <label for="prop-time">Arrival Time (HH:MM)</label>
        <input type="time" id="prop-time" value="${data.time || '09:00'}" ${triggerMode === 'conditional' ? 'disabled' : ''} />
        ${triggerMode === 'conditional' ? '<span class="form-hint">Time not used in conditional mode</span>' : ''}
      </div>
      ${this.renderCharacterDropdown('prop-from', 'From', data.from || '')}
      <div class="form-group">
        <label for="prop-subject">Subject</label>
        <input type="text" id="prop-subject" value="${this.escapeHtml(data.subject || '')}" placeholder="Email subject..." />
      </div>
      <div class="form-group">
        <label for="prop-body">Body</label>
        <textarea id="prop-body" rows="4">${this.escapeHtml(data.body || '')}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="prop-urgent" ${data.urgent ? 'checked' : ''} />
            Urgent
          </label>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="prop-requires-response" ${data.requiresResponse ? 'checked' : ''} />
            Requires Response
          </label>
        </div>
      </div>
    `;
  }

  /**
   * Render meeting node panel
   */
  private renderMeetingPanel(data: { triggerMode?: TriggerMode; time: string; duration: number; title: string; participants: string[]; energyCost: number; stressCost: number }): string {
    const triggerMode = data.triggerMode || 'scheduled';
    const characters = entityRegistry.getCharacters();

    return `
      ${this.renderTriggerModeSelector(triggerMode)}
      <div class="form-group time-field" ${triggerMode === 'conditional' ? 'style="opacity: 0.5"' : ''}>
        <label for="prop-time">Start Time (HH:MM)</label>
        <input type="time" id="prop-time" value="${data.time || '10:00'}" ${triggerMode === 'conditional' ? 'disabled' : ''} />
      </div>
      <div class="form-group">
        <label for="prop-duration">Duration (minutes)</label>
        <input type="number" id="prop-duration" value="${data.duration || 30}" min="5" max="480" step="5" />
      </div>
      <div class="form-group">
        <label for="prop-title">Title</label>
        <input type="text" id="prop-title" value="${this.escapeHtml(data.title || '')}" placeholder="Meeting title..." />
      </div>
      <div class="form-group">
        <label>Participants</label>
        <div id="participants-list" class="participants-list">
          ${(data.participants || []).map((p, i) => `
            <div class="participant-row" data-index="${i}">
              <select class="participant-select entity-dropdown" data-index="${i}">
                <option value="">-- Select --</option>
                ${characters.map(c => `<option value="${c.id}" ${p === c.id || p === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
              <button class="remove-participant-btn" data-index="${i}">&times;</button>
            </div>
          `).join('')}
        </div>
        <button class="button button-secondary" id="add-participant-btn" style="margin-top: 8px;">+ Add Participant</button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="prop-energy-cost">Energy Cost</label>
          <input type="number" id="prop-energy-cost" value="${data.energyCost || 15}" min="0" max="100" />
        </div>
        <div class="form-group">
          <label for="prop-stress-cost">Stress Gain</label>
          <input type="number" id="prop-stress-cost" value="${data.stressCost || 10}" min="0" max="100" />
        </div>
      </div>
    `;
  }

  /**
   * Render task node panel
   */
  private renderTaskPanel(data: { triggerMode?: TriggerMode; time: string; deadline?: string; title: string; description: string; priority: string; energyCost: number; duration: number }): string {
    const triggerMode = data.triggerMode || 'scheduled';
    const priorities = ['low', 'medium', 'high'];

    return `
      ${this.renderTriggerModeSelector(triggerMode)}
      <div class="form-group time-field" ${triggerMode === 'conditional' ? 'style="opacity: 0.5"' : ''}>
        <label for="prop-time">Available Time (HH:MM)</label>
        <input type="time" id="prop-time" value="${data.time || '09:00'}" ${triggerMode === 'conditional' ? 'disabled' : ''} />
      </div>
      <div class="form-group">
        <label for="prop-deadline">Deadline (optional)</label>
        <input type="time" id="prop-deadline" value="${data.deadline || ''}" />
      </div>
      <div class="form-group">
        <label for="prop-title">Title</label>
        <input type="text" id="prop-title" value="${this.escapeHtml(data.title || '')}" placeholder="Task title..." />
      </div>
      <div class="form-group">
        <label for="prop-description">Description</label>
        <textarea id="prop-description" rows="3">${this.escapeHtml(data.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label for="prop-priority">Priority</label>
        <select id="prop-priority">
          ${priorities.map(p => `<option value="${p}" ${data.priority === p ? 'selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="prop-duration">Duration (min)</label>
          <input type="number" id="prop-duration" value="${data.duration || 30}" min="5" max="480" step="5" />
        </div>
        <div class="form-group">
          <label for="prop-energy-cost">Energy Cost</label>
          <input type="number" id="prop-energy-cost" value="${data.energyCost || 10}" min="0" max="100" />
        </div>
      </div>
    `;
  }

  /**
   * Render message node panel
   */
  private renderMessagePanel(data: { triggerMode?: TriggerMode; time: string; channel: string; from: string; text: string; requiresResponse: boolean }): string {
    const triggerMode = data.triggerMode || 'scheduled';
    const channels = ['slack', 'teams', 'chat'];

    return `
      ${this.renderTriggerModeSelector(triggerMode)}
      <div class="form-group time-field" ${triggerMode === 'conditional' ? 'style="opacity: 0.5"' : ''}>
        <label for="prop-time">Arrival Time (HH:MM)</label>
        <input type="time" id="prop-time" value="${data.time || '09:00'}" ${triggerMode === 'conditional' ? 'disabled' : ''} />
      </div>
      <div class="form-group">
        <label for="prop-channel">Channel</label>
        <select id="prop-channel">
          ${channels.map(c => `<option value="${c}" ${data.channel === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}
        </select>
      </div>
      ${this.renderCharacterDropdown('prop-from', 'From', data.from || '')}
      <div class="form-group">
        <label for="prop-text">Message Text</label>
        <textarea id="prop-text" rows="3">${this.escapeHtml(data.text || '')}</textarea>
      </div>
      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" id="prop-requires-response" ${data.requiresResponse ? 'checked' : ''} />
          Requires Response
        </label>
      </div>
    `;
  }

  /**
   * Render effects editor
   */
  private renderEffectsEditor(effects: Effect[], prefix: string): string {
    const types = ['stat', 'relationship', 'flag', 'item', 'scene'];
    const operations = ['+', '-', '='];
    const stats = entityRegistry.getStats();
    const characters = entityRegistry.getCharacters();

    return effects.map((effect, i) => `
      <div class="effect-row" data-prefix="${prefix}" data-index="${i}">
        <select class="effect-type" data-index="${i}">
          ${types.map(t => `<option value="${t}" ${effect.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        <div class="effect-target-wrapper">
          ${effect.type === 'stat' ? `
            <select class="effect-target-select entity-dropdown" data-index="${i}">
              <option value="">-- Stat --</option>
              ${stats.map(s => `<option value="${s.id}" ${effect.target === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
          ` : effect.type === 'relationship' ? `
            <select class="effect-target-select entity-dropdown" data-index="${i}">
              <option value="">-- Character --</option>
              ${characters.map(c => `<option value="${c.id}" ${effect.target === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          ` : `
            <input type="text" class="effect-target" data-index="${i}" value="${this.escapeHtml(effect.target)}" placeholder="target" />
          `}
        </div>
        <select class="effect-operation" data-index="${i}">
          ${operations.map(o => `<option value="${o}" ${effect.operation === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
        <input type="text" class="effect-value" data-index="${i}" value="${effect.value}" placeholder="value" />
        <button class="remove-effect-btn" data-index="${i}" title="Remove">&times;</button>
      </div>
    `).join('') || '<p class="text-dim">No effects</p>';
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Close button
    this.panel.querySelector('.property-panel-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Dialogue fields - speaker dropdown
    const speakerSelect = this.panel.querySelector('#prop-speaker') as HTMLSelectElement;
    const textInput = this.panel.querySelector('#prop-text') as HTMLTextAreaElement;
    const emotionSelect = this.panel.querySelector('#prop-emotion') as HTMLSelectElement;

    if (speakerSelect) {
      speakerSelect.addEventListener('change', () => {
        this.emitUpdate({ speaker: speakerSelect.value });
      });
    }

    if (textInput) {
      textInput.addEventListener('change', () => {
        this.emitUpdate({ text: textInput.value });
      });
    }

    if (emotionSelect) {
      emotionSelect.addEventListener('change', () => {
        this.emitUpdate({ emotion: emotionSelect.value });
      });
    }

    // Choice options
    this.panel.querySelectorAll('.choice-text').forEach(input => {
      input.addEventListener('change', () => {
        this.updateChoiceOptions();
      });
    });

    this.panel.querySelector('#add-choice-btn')?.addEventListener('click', () => {
      this.addChoiceOption();
    });

    this.panel.querySelectorAll('.remove-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).dataset.index || '0');
        this.removeChoiceOption(index);
      });
    });

    // Condition fields
    const condType = this.panel.querySelector('#prop-cond-type') as HTMLSelectElement;
    const condTarget = this.panel.querySelector('#prop-cond-target') as HTMLInputElement | HTMLSelectElement;
    const condOperator = this.panel.querySelector('#prop-cond-operator') as HTMLSelectElement;
    const condValue = this.panel.querySelector('#prop-cond-value') as HTMLInputElement;

    // Type change needs to re-render to show correct target dropdown
    condType?.addEventListener('change', () => {
      this.emitUpdate({
        condition: {
          type: condType.value || 'stat',
          target: '', // Reset target when type changes
          operator: condOperator?.value || '>',
          value: this.parseValue(condValue?.value || '0'),
        }
      });
      this.render();
    });

    [condTarget, condOperator, condValue].forEach(el => {
      if (el) {
        el.addEventListener('change', () => {
          this.emitUpdate({
            condition: {
              type: condType?.value || 'stat',
              target: condTarget?.value || '',
              operator: condOperator?.value || '>',
              value: this.parseValue(condValue?.value || '0'),
            }
          });
        });
      }
    });

    // Effect fields
    this.panel.querySelector('#add-effect-btn')?.addEventListener('click', () => {
      this.addEffect();
    });

    this.attachEffectListeners();

    // Timed event fields (email, meeting, task, message)
    this.attachTimedEventListeners();
  }

  /**
   * Attach listeners for timed event node types
   */
  private attachTimedEventListeners(): void {
    // Trigger mode buttons
    this.panel.querySelectorAll('.trigger-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = (e.target as HTMLElement).dataset.mode as TriggerMode;
        this.emitUpdate({ triggerMode: mode });
        // Re-render to update time field state
        this.render();
      });
    });


    // Entity dropdowns (from field)
    const fromSelect = this.panel.querySelector('#prop-from') as HTMLSelectElement;
    if (fromSelect) {
      fromSelect.addEventListener('change', () => {
        this.emitUpdate({ from: fromSelect.value });
      });
    }

    // Common time field
    const timeInput = this.panel.querySelector('#prop-time') as HTMLInputElement;
    if (timeInput) {
      timeInput.addEventListener('change', () => {
        this.emitUpdate({ time: timeInput.value });
      });
    }

    // Participant management
    this.panel.querySelectorAll('.participant-select').forEach(select => {
      select.addEventListener('change', () => {
        this.updateParticipants();
      });
    });

    this.panel.querySelector('#add-participant-btn')?.addEventListener('click', () => {
      this.addParticipant();
    });

    this.panel.querySelectorAll('.remove-participant-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).dataset.index || '0');
        this.removeParticipant(index);
      });
    });

    // Legacy: From field as text input (keep for backwards compat)
    const fromInput = this.panel.querySelector('#prop-from') as HTMLInputElement;
    if (fromInput && fromInput.tagName === 'INPUT') {
      fromInput.addEventListener('change', () => {
        this.emitUpdate({ from: fromInput.value });
      });
    }

    // Subject field (email)
    const subjectInput = this.panel.querySelector('#prop-subject') as HTMLInputElement;
    if (subjectInput) {
      subjectInput.addEventListener('change', () => {
        this.emitUpdate({ subject: subjectInput.value });
      });
    }

    // Body field (email)
    const bodyInput = this.panel.querySelector('#prop-body') as HTMLTextAreaElement;
    if (bodyInput) {
      bodyInput.addEventListener('change', () => {
        this.emitUpdate({ body: bodyInput.value });
      });
    }

    // Urgent checkbox (email)
    const urgentInput = this.panel.querySelector('#prop-urgent') as HTMLInputElement;
    if (urgentInput) {
      urgentInput.addEventListener('change', () => {
        this.emitUpdate({ urgent: urgentInput.checked });
      });
    }

    // Requires response checkbox (email, message)
    const requiresResponseInput = this.panel.querySelector('#prop-requires-response') as HTMLInputElement;
    if (requiresResponseInput) {
      requiresResponseInput.addEventListener('change', () => {
        this.emitUpdate({ requiresResponse: requiresResponseInput.checked });
      });
    }

    // Duration field (meeting, task)
    const durationInput = this.panel.querySelector('#prop-duration') as HTMLInputElement;
    if (durationInput) {
      durationInput.addEventListener('change', () => {
        this.emitUpdate({ duration: parseInt(durationInput.value) || 30 });
      });
    }

    // Title field (meeting, task)
    const titleInput = this.panel.querySelector('#prop-title') as HTMLInputElement;
    if (titleInput) {
      titleInput.addEventListener('change', () => {
        this.emitUpdate({ title: titleInput.value });
      });
    }

    // Participants field (meeting)
    const participantsInput = this.panel.querySelector('#prop-participants') as HTMLInputElement;
    if (participantsInput) {
      participantsInput.addEventListener('change', () => {
        const participants = participantsInput.value
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 0);
        this.emitUpdate({ participants });
      });
    }

    // Energy cost field (meeting, task)
    const energyCostInput = this.panel.querySelector('#prop-energy-cost') as HTMLInputElement;
    if (energyCostInput) {
      energyCostInput.addEventListener('change', () => {
        this.emitUpdate({ energyCost: parseInt(energyCostInput.value) || 0 });
      });
    }

    // Stress cost field (meeting)
    const stressCostInput = this.panel.querySelector('#prop-stress-cost') as HTMLInputElement;
    if (stressCostInput) {
      stressCostInput.addEventListener('change', () => {
        this.emitUpdate({ stressCost: parseInt(stressCostInput.value) || 0 });
      });
    }

    // Description field (task)
    const descriptionInput = this.panel.querySelector('#prop-description') as HTMLTextAreaElement;
    if (descriptionInput) {
      descriptionInput.addEventListener('change', () => {
        this.emitUpdate({ description: descriptionInput.value });
      });
    }

    // Priority field (task)
    const prioritySelect = this.panel.querySelector('#prop-priority') as HTMLSelectElement;
    if (prioritySelect) {
      prioritySelect.addEventListener('change', () => {
        this.emitUpdate({ priority: prioritySelect.value });
      });
    }

    // Deadline field (task)
    const deadlineInput = this.panel.querySelector('#prop-deadline') as HTMLInputElement;
    if (deadlineInput) {
      deadlineInput.addEventListener('change', () => {
        this.emitUpdate({ deadline: deadlineInput.value || undefined });
      });
    }

    // Channel field (message)
    const channelSelect = this.panel.querySelector('#prop-channel') as HTMLSelectElement;
    if (channelSelect) {
      channelSelect.addEventListener('change', () => {
        this.emitUpdate({ channel: channelSelect.value });
      });
    }
  }

  /**
   * Show modal to add a new entity
   */
  private showAddEntityModal(type: string, targetField: string): void {
    const modal = document.createElement('div');
    modal.className = 'entity-modal';
    modal.innerHTML = `
      <div class="entity-modal-content">
        <div class="entity-modal-header">
          <h4>Add New ${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
          <button class="entity-modal-close">&times;</button>
        </div>
        <div class="entity-modal-body">
          <div class="form-group">
            <label for="entity-name">Name</label>
            <input type="text" id="entity-name" placeholder="${type === 'character' ? 'Character name...' : 'Stat name...'}" />
          </div>
          ${type === 'character' ? `
            <div class="form-group">
              <label for="entity-role">Role (optional)</label>
              <input type="text" id="entity-role" placeholder="e.g., Manager, Coworker..." />
            </div>
          ` : `
            <div class="form-row">
              <div class="form-group">
                <label for="entity-min">Min</label>
                <input type="number" id="entity-min" value="0" />
              </div>
              <div class="form-group">
                <label for="entity-max">Max</label>
                <input type="number" id="entity-max" value="100" />
              </div>
            </div>
          `}
        </div>
        <div class="entity-modal-footer">
          <button class="button button-secondary" id="entity-cancel-btn">Cancel</button>
          <button class="button" id="entity-create-btn">Create</button>
        </div>
      </div>
    `;

    this.panel.appendChild(modal);

    // Focus the name input
    const nameInput = modal.querySelector('#entity-name') as HTMLInputElement;
    nameInput?.focus();

    // Close handlers
    modal.querySelector('.entity-modal-close')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#entity-cancel-btn')?.addEventListener('click', () => modal.remove());

    // Create handler
    modal.querySelector('#entity-create-btn')?.addEventListener('click', async () => {
      const name = nameInput?.value?.trim();
      if (!name) {
        nameInput?.focus();
        return;
      }

      if (type === 'character') {
        const role = (modal.querySelector('#entity-role') as HTMLInputElement)?.value?.trim();
        const char = await entityRegistry.addCharacter({ name, role });
        this.emitUpdate({ from: char.id });
      } else {
        const min = parseInt((modal.querySelector('#entity-min') as HTMLInputElement)?.value || '0');
        const max = parseInt((modal.querySelector('#entity-max') as HTMLInputElement)?.value || '100');
        const stat = await entityRegistry.addStat({ name, min, max, default: Math.floor((min + max) / 2) });
        // Update the target field with the new stat
        this.emitUpdate({ [targetField.replace('prop-', '')]: stat.id });
      }

      modal.remove();
      this.render(); // Re-render to show new entity in dropdown
    });

    // Enter key to submit
    nameInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        modal.querySelector('#entity-create-btn')?.dispatchEvent(new Event('click'));
      }
    });
  }

  /**
   * Update participants list
   */
  private updateParticipants(): void {
    const participants: string[] = [];
    this.panel.querySelectorAll('.participant-select').forEach(select => {
      const value = (select as HTMLSelectElement).value;
      if (value) participants.push(value);
    });
    this.emitUpdate({ participants });
  }

  /**
   * Add participant
   */
  private addParticipant(): void {
    if (!this.currentNode) return;
    const data = this.currentNode.toData() as any;
    const participants = [...(data.participants || []), ''];
    this.emitUpdate({ participants });
    this.render();
  }

  /**
   * Remove participant
   */
  private removeParticipant(index: number): void {
    if (!this.currentNode) return;
    const data = this.currentNode.toData() as any;
    const participants = [...(data.participants || [])];
    participants.splice(index, 1);
    this.emitUpdate({ participants });
    this.render();
  }

  /**
   * Attach listeners to effect rows
   */
  private attachEffectListeners(): void {
    this.panel.querySelectorAll('.effect-row').forEach(row => {
      const inputs = row.querySelectorAll('select, input');
      inputs.forEach(input => {
        input.addEventListener('change', () => {
          this.updateEffects();
        });
      });

      // When effect type changes, need to re-render to show correct target dropdown
      const typeSelect = row.querySelector('.effect-type');
      typeSelect?.addEventListener('change', () => {
        // Update effects first, then re-render
        this.updateEffects();
        this.render();
      });
    });

    this.panel.querySelectorAll('.remove-effect-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).dataset.index || '0');
        this.removeEffect(index);
      });
    });
  }

  /**
   * Update choice options
   */
  private updateChoiceOptions(): void {
    const options: ChoiceOption[] = [];

    this.panel.querySelectorAll('.choice-option').forEach((el, index) => {
      const textInput = el.querySelector('.choice-text') as HTMLInputElement;
      options.push({
        id: String(index + 1),
        text: textInput?.value || '',
        effects: [], // TODO: parse effects from choice
        outputPortId: '',
      });
    });

    this.emitUpdate({ options });
  }

  /**
   * Add choice option
   */
  private addChoiceOption(): void {
    if (!this.currentNode) return;

    const data = this.currentNode.toData() as any;
    const options = [...(data.options || [])];
    options.push({
      id: String(options.length + 1),
      text: `Option ${options.length + 1}`,
      effects: [],
      outputPortId: '',
    });

    this.emitUpdate({ options });
    this.render();
  }

  /**
   * Remove choice option
   */
  private removeChoiceOption(index: number): void {
    if (!this.currentNode) return;

    const data = this.currentNode.toData() as any;
    const options = [...(data.options || [])];
    options.splice(index, 1);

    this.emitUpdate({ options });
    this.render();
  }

  /**
   * Update effects
   */
  private updateEffects(): void {
    const effects: Effect[] = [];

    this.panel.querySelectorAll('.effect-row').forEach(row => {
      const type = (row.querySelector('.effect-type') as HTMLSelectElement)?.value as Effect['type'];

      // Get target from either dropdown or text input
      const targetSelect = row.querySelector('.effect-target-select') as HTMLSelectElement;
      const targetInput = row.querySelector('.effect-target') as HTMLInputElement;
      const target = targetSelect?.value || targetInput?.value || '';

      const operation = (row.querySelector('.effect-operation') as HTMLSelectElement)?.value as Effect['operation'];
      const value = this.parseValue((row.querySelector('.effect-value') as HTMLInputElement)?.value || '0');

      effects.push({ type, target, operation, value });
    });

    this.emitUpdate({ effects });
  }

  /**
   * Add effect
   */
  private addEffect(): void {
    if (!this.currentNode) return;

    const data = this.currentNode.toData() as any;
    const effects = [...(data.effects || [])];
    effects.push({ type: 'stat', target: 'energy', operation: '-', value: 10 });

    this.emitUpdate({ effects });
    this.render();
  }

  /**
   * Remove effect
   */
  private removeEffect(index: number): void {
    if (!this.currentNode) return;

    const data = this.currentNode.toData() as any;
    const effects = [...(data.effects || [])];
    effects.splice(index, 1);

    this.emitUpdate({ effects });
    this.render();
  }

  /**
   * Emit update to callback
   */
  private emitUpdate(updates: Record<string, any>): void {
    if (this.updateCallback && this.currentNode) {
      this.updateCallback(this.currentNode.id, updates);
    }
  }

  /**
   * Parse value (number or string)
   */
  private parseValue(value: string): number | string | boolean {
    if (value === 'true') return true;
    if (value === 'false') return false;
    const num = parseFloat(value);
    return isNaN(num) ? value : num;
  }

  /**
   * Escape HTML
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
