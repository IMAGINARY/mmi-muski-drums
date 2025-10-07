// eslint-disable-next-line import/no-relative-packages
import MuskiDrumsManager from '../../../vendor/muski-drums/src/js/muski-drums-manager';
// eslint-disable-next-line import/no-relative-packages
import MuskiDrums from '../../../vendor/muski-drums/src/js/muski-drums';
import PatternDiagram from './pattern-diagram';
import Explainer from './explainer';
import howDoesItWorkContent from '../../../content/how-does-it-work.md';
import IdleMonitor from './idle-monitor';

export default class MuskiDrumsApp {
  constructor(config) {
    this.config = config;
    this.drumsManager = null;
    this.drumMachine = null;
    this.generationMode = null;
    this.currentLoopPlayCount = 0;
    this.shouldRegeneratePattern = false;
    this.loopsPlayedSinceLastInput = 0;
    this.$element = $('<div></div>')
      .addClass('muski-drums-app');
    if (this.config.app.theme) {
      this.$element.addClass(`theme-${this.config.app.theme}`);
    }
    if (this.config.app.idleClearSeconds && this.config.app.idleClearSeconds > 0) {
      this.idleMonitor = new IdleMonitor(
        this.config.app.idleClearSeconds,
        this.handleIdleTimeout.bind(this)
      );
    }
    if (this.config.app.idleReloadSeconds && this.config.app.idleReloadSeconds > 0) {
      this.reloadIdleMonitor = new IdleMonitor(
        this.config.app.idleReloadSeconds,
        () => { window.location.reload(); },
      );
    }
  }

  async init() {
    this.drumsManager = new MuskiDrumsManager({
      aiCheckpointUrl: this.config.app.checkpointUrl,
      soundFontUrl: this.config.app.soundfontUrl,
    });
    await this.drumsManager.init();
    await this.drumsManager.warmUpAI();
    this.drumMachine = new MuskiDrums(
      this.drumsManager.ai,
      this.drumsManager.sampler,
      this.drumsManager.createToneTransport(),
      {
        lang: this.config.i18n.defaultLanguage,
        strings: this.config.i18n.strings,
        drums: this.config.drumMachine.drums.map((d) => d.id),
        tempo: this.config.drumMachine.defaultTempo,
        withRandom: this.config.drumMachine.withRandomGenerator,
        editableOutput: this.config.drumMachine.editableOutput,
        preset: null,
      }
    );
    // Set volumes
    this.config.drumMachine.drums.forEach((drum) => {
      if (drum.vol !== undefined) {
        this.drumMachine.setDrumVolume(drum.id, drum.vol);
      }
    });

    this.drumMachine.events.on('start', this.handleDrumMachineStart.bind(this));
    this.drumMachine.events.on('step', this.handleDrumMachineStep.bind(this));
    this.drumMachine.events.on('stop', this.handleDrumMachineStop.bind(this));
    this.drumMachine.sequencer.events.on('update', this.handleSequenceUpdate.bind(this));

    const drumPane = $('<div></div>')
      .addClass('muski-drums-pane');
    this.$element.append(drumPane);

    drumPane.append(this.drumMachine.$element);
    const $controls = $('<div></div>')
      .addClass('muski-drums-app-controls');

    this.$aiButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-light', 'btn-lg', 'btn-control', 'btn-gen-n-play', 'btn-ai', 'me-3'])
      .text(this.getString('generate-ai-button'))
      .on('click', () => { this.handleAiButton(); })
      .appendTo($controls);

    this.$randomButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-light', 'btn-lg', 'btn-control', 'btn-gen-n-play', 'btn-random', 'me-3'])
      .text(this.getString('generate-rnd-button'))
      .on('click', () => { this.handleRandomButton(); })
      .appendTo($controls);

    this.$stopButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-light', 'btn-lg', 'btn-round', 'btn-control', 'btn-stop', 'me-3'])
      .text(this.getString('stop-button'))
      .on('click', () => { this.handleStopButton(); })
      .appendTo($controls);

    this.$clearButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-light', 'btn-lg', 'btn-round', 'btn-control', 'btn-clear'])
      .text(this.getString('clear-button'))
      .on('click', () => { this.handleClearButton(); })
      .appendTo($controls);

    drumPane.append($controls);
    this.initExamples();
    this.initExplainer();
  }

  initExamples() {
    $('<div></div>')
      .addClass('muski-drums-examples')
      .append(
        this.config?.examples?.map((example) => (
          $('<div></div>')
            .addClass('muski-drums-example')
            .append(
              $('<div></div>')
                .addClass('title')
                .text(example?.title?.[this.config.i18n.defaultLanguage] || example.title.en || '')
            )
            .append(
              PatternDiagram.createElement(example.rows, example.cols, example.pattern)
            )
        ))
      )
      .appendTo(this.$element);
  }

  initExplainer() {
    this.explainer = new Explainer(howDoesItWorkContent);
    this.$element.append(this.explainer.$element);

    this.$explainerButtonAligner = $('<div></div>')
      .addClass('explainer-button-aligner')
      .appendTo(this.$element);

    this.$explainerButton = $('<button></button>')
      .attr('type', 'button')
      .addClass(['btn', 'btn-outline', 'btn-lg', 'btn-explainer'])
      .on('click', () => {
        this.$element.toggleClass('with-explainer');
      })
      .append(
        $('<span></span>')
          .addClass('open-text')
          .html(this.getString('how-does-it-work-button'))
      )
      .append(
        $('<span></span>')
          .addClass('close-icon')
      )
      .appendTo(this.$explainerButtonAligner);
  }

  closeExplainer() {
    this.$element.removeClass('with-explainer');
  }

  getString(id) {
    return this.config.i18n.strings?.[this.config.i18n.defaultLanguage || 'en']?.[id];
  }

  stopDrumMachine() {
    if (this.drumMachine && this.drumMachine.isPlaying()) {
      this.drumMachine.stop();
    }
    this.updateControls();
  }

  clearSequencer() {
    this.drumMachine.sequencer.clear();
  }

  async handleAiButton() {
    if (!this.drumMachine) {
      throw new Error('Drum machine is not initialized.');
    }
    // Do the first generation before starting the drum machine,
    // otherwise the audio skips during the first few steps.
    if (!this.drumMachine.isPlaying()) {
      await this.drumMachine.generateUsingAI();
      this.shouldRegeneratePattern = false;
    } else {
      this.shouldRegeneratePattern = true;
    }
    this.generationMode = 'ai';
    this.loopsPlayedSinceLastInput = 0;
    if (!this.drumMachine.isPlaying()) {
      this.drumMachine.start();
    }
    this.updateControls();
  }

  handleRandomButton() {
    if (!this.drumMachine) {
      throw new Error('Drum machine is not initialized.');
    }
    this.generationMode = 'random';
    this.shouldRegeneratePattern = true;
    this.loopsPlayedSinceLastInput = 0;
    if (!this.drumMachine.isPlaying()) {
      this.drumMachine.start();
    }
    this.updateControls();
  }

  handleStopButton() {
    if (!this.drumMachine) {
      throw new Error('Drum machine is not initialized.');
    }
    this.stopDrumMachine();
  }

  handleClearButton() {
    if (!this.drumMachine) {
      throw new Error('Drum machine is not initialized.');
    }
    this.stopDrumMachine();
    this.clearSequencer();
  }

  handleDrumMachineStart() {
    this.currentLoopPlayCount = 0;
    this.stopIdleMonitoring();
    this.updateControls();
  }

  handleDrumMachineStep(step) {
    if (step === 0) {
      if (this.loopsPlayedSinceLastInput >= this.config.app.maxIdleLoops) {
        this.stopDrumMachine();
      } else {
        this.loopsPlayedSinceLastInput += 1;
        if ((this.shouldRegeneratePattern || this.currentLoopPlayCount >= 2)) {
          if (this.generationMode === 'ai') {
            this.drumMachine.generateUsingAI();
          } else if (this.generationMode === 'random') {
            this.drumMachine.generateUsingRandomAlgorithm();
          }
          this.shouldRegeneratePattern = false;
          this.currentLoopPlayCount = 1;
        } else {
          this.currentLoopPlayCount += 1;
        }
      }
    }
  }

  handleDrumMachineStop() {
    this.startIdleMonitoring();
    this.updateControls();
  }

  handleSequenceUpdate() {
    if (this.drumMachine.isPlaying()) {
      this.shouldRegeneratePattern = true;
      this.loopsPlayedSinceLastInput = 0;
    }
  }

  updateControls() {
    if (this.drumMachine.isPlaying() && this.generationMode === 'ai') {
      this.$aiButton.addClass('active');
      this.$randomButton.removeClass('active');
    } else if (this.drumMachine.isPlaying() && this.generationMode === 'random') {
      this.$aiButton.removeClass('active');
      this.$randomButton.addClass('active');
    } else {
      this.$aiButton.removeClass('active');
      this.$randomButton.removeClass('active');
    }
  }

  startIdleMonitoring() {
    this.idleMonitor?.start();
    this.reloadIdleMonitor?.start();
  }

  stopIdleMonitoring() {
    this.idleMonitor?.stop();
    this.reloadIdleMonitor?.stop();
  }

  handleIdleTimeout() {
    this.stopDrumMachine();
    this.clearSequencer();
    this.closeExplainer();
  }
}
