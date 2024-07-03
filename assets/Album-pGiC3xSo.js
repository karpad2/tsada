import{J as b,K as l,O as h,L as v,_,r as x,i as F,o as $}from"./index-F6GZLLEJ.js";var y={},w=b.extend({style:y});w.extend("focustrap",{mounted:function(e,n){var t=n.value||{},a=t.disabled;a||(this.createHiddenFocusableElements(e,n),this.bind(e,n),this.autoFocus(e,n)),e.setAttribute("data-pd-focustrap",!0),this.$el=e},updated:function(e,n){var t=n.value||{},a=t.disabled;a&&this.unbind(e)},unmounted:function(e){this.unbind(e)},methods:{getComputedSelector:function(e){return':not(.p-hidden-focusable):not([data-p-hidden-focusable="true"])'.concat(e??"")},bind:function(e,n){var t=this,a=n.value||{},r=a.onFocusIn,s=a.onFocusOut;e.$_pfocustrap_mutationobserver=new MutationObserver(function(o){o.forEach(function(u){if(u.type==="childList"&&!e.contains(document.activeElement)){var m=function d(c){var p=l.isFocusableElement(c)?l.isFocusableElement(c,t.getComputedSelector(e.$_pfocustrap_focusableselector))?c:l.getFirstFocusableElement(e,t.getComputedSelector(e.$_pfocustrap_focusableselector)):l.getFirstFocusableElement(c);return h.isNotEmpty(p)?p:c.nextSibling&&d(c.nextSibling)};l.focus(m(u.nextSibling))}})}),e.$_pfocustrap_mutationobserver.disconnect(),e.$_pfocustrap_mutationobserver.observe(e,{childList:!0}),e.$_pfocustrap_focusinlistener=function(o){return r&&r(o)},e.$_pfocustrap_focusoutlistener=function(o){return s&&s(o)},e.addEventListener("focusin",e.$_pfocustrap_focusinlistener),e.addEventListener("focusout",e.$_pfocustrap_focusoutlistener)},unbind:function(e){e.$_pfocustrap_mutationobserver&&e.$_pfocustrap_mutationobserver.disconnect(),e.$_pfocustrap_focusinlistener&&e.removeEventListener("focusin",e.$_pfocustrap_focusinlistener)&&(e.$_pfocustrap_focusinlistener=null),e.$_pfocustrap_focusoutlistener&&e.removeEventListener("focusout",e.$_pfocustrap_focusoutlistener)&&(e.$_pfocustrap_focusoutlistener=null)},autoFocus:function(e,n){var t=n.value||{},a=t.autoFocusSelector,r=a===void 0?"":a,s=t.firstFocusableSelector,o=s===void 0?"":s,u=t.autoFocus,m=u===void 0?!1:u,d=l.getFirstFocusableElement(e,"[autofocus]".concat(this.getComputedSelector(r)));m&&!d&&(d=l.getFirstFocusableElement(e,this.getComputedSelector(o))),l.focus(d)},onFirstHiddenElementFocus:function(e){var n,t=e.currentTarget,a=e.relatedTarget,r=a===t.$_pfocustrap_lasthiddenfocusableelement||!((n=this.$el)!==null&&n!==void 0&&n.contains(a))?l.getFirstFocusableElement(t.parentElement,this.getComputedSelector(t.$_pfocustrap_focusableselector)):t.$_pfocustrap_lasthiddenfocusableelement;l.focus(r)},onLastHiddenElementFocus:function(e){var n,t=e.currentTarget,a=e.relatedTarget,r=a===t.$_pfocustrap_firsthiddenfocusableelement||!((n=this.$el)!==null&&n!==void 0&&n.contains(a))?l.getLastFocusableElement(t.parentElement,this.getComputedSelector(t.$_pfocustrap_focusableselector)):t.$_pfocustrap_firsthiddenfocusableelement;l.focus(r)},createHiddenFocusableElements:function(e,n){var t=this,a=n.value||{},r=a.tabIndex,s=r===void 0?0:r,o=a.firstFocusableSelector,u=o===void 0?"":o,m=a.lastFocusableSelector,d=m===void 0?"":m,c=function(g){return l.createElement("span",{class:"p-hidden-accessible p-hidden-focusable",tabIndex:s,role:"presentation","aria-hidden":!0,"data-p-hidden-accessible":!0,"data-p-hidden-focusable":!0,onFocus:g==null?void 0:g.bind(t)})},p=c(this.onFirstHiddenElementFocus),f=c(this.onLastHiddenElementFocus);p.$_pfocustrap_lasthiddenfocusableelement=f,p.$_pfocustrap_focusableselector=u,p.setAttribute("data-pc-section","firstfocusableelement"),f.$_pfocustrap_firsthiddenfocusableelement=p,f.$_pfocustrap_focusableselector=d,f.setAttribute("data-pc-section","lastfocusableelement"),e.prepend(p),e.append(f)}}});var E=`
@layer primevue {
    .p-galleria-content {
        display: flex;
        flex-direction: column;
    }

    .p-galleria-item-wrapper {
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .p-galleria-item-container {
        position: relative;
        display: flex;
        height: 100%;
    }

    .p-galleria-item-nav {
        position: absolute;
        top: 50%;
        margin-top: -0.5rem;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }

    .p-galleria-item-prev {
        left: 0;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }

    .p-galleria-item-next {
        right: 0;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }

    .p-galleria-item {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
    }

    .p-galleria-item-nav-onhover .p-galleria-item-nav {
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
    }

    .p-galleria-item-nav-onhover .p-galleria-item-wrapper:hover .p-galleria-item-nav {
        pointer-events: all;
        opacity: 1;
    }

    .p-galleria-item-nav-onhover .p-galleria-item-wrapper:hover .p-galleria-item-nav.p-disabled {
        pointer-events: none;
    }

    .p-galleria-caption {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
    }

    /* Thumbnails */
    .p-galleria-thumbnail-wrapper {
        display: flex;
        flex-direction: column;
        overflow: auto;
        flex-shrink: 0;
    }

    .p-galleria-thumbnail-prev,
    .p-galleria-thumbnail-next {
        align-self: center;
        flex: 0 0 auto;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        position: relative;
    }

    .p-galleria-thumbnail-prev span,
    .p-galleria-thumbnail-next span {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .p-galleria-thumbnail-container {
        display: flex;
        flex-direction: row;
    }

    .p-galleria-thumbnail-items-container {
        overflow: hidden;
        width: 100%;
    }

    .p-galleria-thumbnail-items {
        display: flex;
    }

    .p-galleria-thumbnail-item {
        overflow: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.5;
    }

    .p-galleria-thumbnail-item:hover {
        opacity: 1;
        transition: opacity 0.3s;
    }

    .p-galleria-thumbnail-item-current {
        opacity: 1;
    }

    /* Positions */
    /* Thumbnails */
    .p-galleria-thumbnails-left .p-galleria-content,
    .p-galleria-thumbnails-right .p-galleria-content {
        flex-direction: row;
    }

    .p-galleria-thumbnails-left .p-galleria-item-wrapper,
    .p-galleria-thumbnails-right .p-galleria-item-wrapper {
        flex-direction: row;
    }

    .p-galleria-thumbnails-left .p-galleria-item-wrapper,
    .p-galleria-thumbnails-top .p-galleria-item-wrapper {
        order: 2;
    }

    .p-galleria-thumbnails-left .p-galleria-thumbnail-wrapper,
    .p-galleria-thumbnails-top .p-galleria-thumbnail-wrapper {
        order: 1;
    }

    .p-galleria-thumbnails-left .p-galleria-thumbnail-container,
    .p-galleria-thumbnails-right .p-galleria-thumbnail-container {
        flex-direction: column;
        flex-grow: 1;
    }

    .p-galleria-thumbnails-left .p-galleria-thumbnail-items,
    .p-galleria-thumbnails-right .p-galleria-thumbnail-items {
        flex-direction: column;
        height: 100%;
    }

    /* Indicators */
    .p-galleria-indicators {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .p-galleria-indicator > button {
        display: inline-flex;
        align-items: center;
    }

    .p-galleria-indicators-left .p-galleria-item-wrapper,
    .p-galleria-indicators-right .p-galleria-item-wrapper {
        flex-direction: row;
        align-items: center;
    }

    .p-galleria-indicators-left .p-galleria-item-container,
    .p-galleria-indicators-top .p-galleria-item-container {
        order: 2;
    }

    .p-galleria-indicators-left .p-galleria-indicators,
    .p-galleria-indicators-top .p-galleria-indicators {
        order: 1;
    }

    .p-galleria-indicators-left .p-galleria-indicators,
    .p-galleria-indicators-right .p-galleria-indicators {
        flex-direction: column;
    }

    .p-galleria-indicator-onitem .p-galleria-indicators {
        position: absolute;
        display: flex;
        z-index: 1;
    }

    .p-galleria-indicator-onitem.p-galleria-indicators-top .p-galleria-indicators {
        top: 0;
        left: 0;
        width: 100%;
        align-items: flex-start;
    }

    .p-galleria-indicator-onitem.p-galleria-indicators-right .p-galleria-indicators {
        right: 0;
        top: 0;
        height: 100%;
        align-items: flex-end;
    }

    .p-galleria-indicator-onitem.p-galleria-indicators-bottom .p-galleria-indicators {
        bottom: 0;
        left: 0;
        width: 100%;
        align-items: flex-end;
    }

    .p-galleria-indicator-onitem.p-galleria-indicators-left .p-galleria-indicators {
        left: 0;
        top: 0;
        height: 100%;
        align-items: flex-start;
    }

    /* FullScreen */
    .p-galleria-mask {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .p-galleria-close {
        position: absolute;
        top: 0;
        right: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }

    .p-galleria-mask .p-galleria-item-nav {
        position: fixed;
        top: 50%;
        margin-top: -0.5rem;
    }

    /* Animation */
    .p-galleria-enter-active {
        transition: all 150ms cubic-bezier(0, 0, 0.2, 1);
    }

    .p-galleria-leave-active {
        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .p-galleria-enter-from,
    .p-galleria-leave-to {
        opacity: 0;
        transform: scale(0.7);
    }

    .p-galleria-enter-active .p-galleria-item-nav {
        opacity: 0;
    }

    /* Keyboard Support */
    .p-items-hidden .p-galleria-thumbnail-item {
        visibility: hidden;
    }

    .p-items-hidden .p-galleria-thumbnail-item.p-galleria-thumbnail-item-active {
        visibility: visible;
    }
}
`,I={mask:function(e){var n=e.instance;return["p-galleria-mask p-component-overlay p-component-overlay-enter",{"p-input-filled":n.$primevue.config.inputStyle==="filled","p-ripple-disabled":n.$primevue.config.ripple===!1}]},root:function(e){var n=e.instance,t=n.$attrs.showThumbnails&&n.getPositionClass("p-galleria-thumbnails",n.$attrs.thumbnailsPosition),a=n.$attrs.showIndicators&&n.getPositionClass("p-galleria-indicators",n.$attrs.indicatorsPosition);return["p-galleria p-component",{"p-galleria-fullscreen":n.$attrs.fullScreen,"p-galleria-indicator-onitem":n.$attrs.showIndicatorsOnItem,"p-galleria-item-nav-onhover":n.$attrs.showItemNavigatorsOnHover&&!n.$attrs.fullScreen},t,a]},closeButton:"p-galleria-close p-link",closeIcon:"p-galleria-close-icon",header:"p-galleria-header",content:"p-galleria-content",footer:"p-galleria-footer",itemWrapper:"p-galleria-item-wrapper",itemContainer:"p-galleria-item-container",previousItemButton:function(e){var n=e.instance;return["p-galleria-item-prev p-galleria-item-nav p-link",{"p-disabled":n.isNavBackwardDisabled()}]},previousItemIcon:"p-galleria-item-prev-icon",item:"p-galleria-item",nextItemButton:function(e){var n=e.instance;return["p-galleria-item-next p-galleria-item-nav p-link",{"p-disabled":n.isNavForwardDisabled()}]},nextItemIcon:"p-galleria-item-next-icon",caption:"p-galleria-caption",indicators:"p-galleria-indicators p-reset",indicator:function(e){var n=e.instance,t=e.index;return["p-galleria-indicator",{"p-highlight":n.isIndicatorItemActive(t)}]},indicatorButton:"p-link",thumbnailWrapper:"p-galleria-thumbnail-wrapper",thumbnailContainer:"p-galleria-thumbnail-container",previousThumbnailButton:function(e){var n=e.instance;return["p-galleria-thumbnail-prev p-link",{"p-disabled":n.isNavBackwardDisabled()}]},previousThumbnailIcon:"p-galleria-thumbnail-prev-icon",thumbnailItemsContainer:"p-galleria-thumbnail-items-container",thumbnailItems:"p-galleria-thumbnail-items",thumbnailItem:function(e){var n=e.instance,t=e.index,a=e.activeIndex;return["p-galleria-thumbnail-item",{"p-galleria-thumbnail-item-current":a===t,"p-galleria-thumbnail-item-active":n.isItemActive(t),"p-galleria-thumbnail-item-start":n.firstItemAciveIndex()===t,"p-galleria-thumbnail-item-end":n.lastItemActiveIndex()===t}]},thumbnailItemContent:"p-galleria-thumbnail-item-content",nextThumbnailButton:function(e){var n=e.instance;return["p-galleria-thumbnail-next p-link",{"p-disabled":n.isNavForwardDisabled()}]},nextThumbnailIcon:"p-galleria-thumbnail-next-icon"};v.extend({name:"galleria",css:E,classes:I});const S={};function T(i,e,n,t,a,r){const s=x("Galleria");return $(),F(s)}const k=_(S,[["render",T]]);export{k as default};
