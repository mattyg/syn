var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { contextProvider } from '@lit-labs/context';
import { synRootContext } from './contexts';
export class SynRootContext extends ScopedElementsMixin(LitElement) {
    render() {
        return html `<slot></slot>`;
    }
    static get styles() {
        return css `
      :host {
        display: contents;
      }
    `;
    }
}
__decorate([
    contextProvider({ context: synRootContext }),
    property()
], SynRootContext.prototype, "rootstore", void 0);
//# sourceMappingURL=syn-root-context.js.map