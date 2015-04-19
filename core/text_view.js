/* jslint node: true */
'use strict';

var View			= require('./view.js').View;
var miscUtil		= require('./misc_util.js');
var strUtil			= require('./string_util.js');
var ansi			= require('./ansi_term.js');
var util			= require('util');
var assert			= require('assert');

exports.TextView			= TextView;

function TextView(options) {
	View.call(this, options);

	var self = this;

	if(options.maxLength) {
		this.maxLength = options.maxLength;
	}

	this.multiLine	= options.multiLine || false;
	this.fillChar	= miscUtil.valueWithDefault(options.fillChar, ' ').substr(0, 1);
	this.justify	= options.justify || 'right';
	this.resizable	= miscUtil.valueWithDefault(options.resizable, true);
	//this.inputType	= options.inputType || 'normal';

	this.isPasswordTextStyle = 'P' === this.textStyle || 'password' === this.textStyle;

	assert(!this.multiLine);	//	:TODO: not yet supported

	if(!this.multiLine) {
		this.dimens.height = 1;
	}
	

	this.drawText = function(s) {
		var ansiColor = this.getANSIColor(this.hasFocus ? this.getFocusColor() : this.getColor());

		if(this.isPasswordTextStyle) {
			this.client.term.write(strUtil.pad(
				new Array(s.length + 1).join(this.textMaskChar), 
				this.dimens.width + 1, 
				this.fillChar, 
				this.justify,
				ansiColor,
				this.getANSIColor(this.getColor())));
		} else {
			var text = strUtil.stylizeString(s, this.hasFocus ? this.focusTextStyle : this.textStyle);
			this.client.term.write(strUtil.pad(
				text, 
				this.dimens.width + 1, 
				this.fillChar, 
				this.justify,
				ansiColor,
				this.getANSIColor(this.getColor())));
		}
	};

	this.setText(options.text || '');

	if(this.isPasswordTextStyle) {
		this.textMaskChar = miscUtil.valueWithDefault(options.textMaskChar, '*').substr(0, 1);
	}
}

util.inherits(TextView, View);

TextView.prototype.redraw = function() {
	TextView.super_.prototype.redraw.call(this);

	this.drawText(this.text);
};

TextView.prototype.setFocus = function(focused) {
	TextView.super_.prototype.setFocus.call(this, focused);

	this.redraw();
	this.client.term.write(ansi.goto(this.position.x, this.position.y + this.text.length));
	this.client.term.write(this.getANSIColor(this.getFocusColor()));
};

TextView.prototype.getData = function() {
	return this.text;
};

TextView.prototype.setText = function(text) {

	var widthDelta = 0;
	if(this.text && this.text !== text) {
		widthDelta = Math.abs(this.text.length - text.length);
	}

	this.text = text;

	if(this.maxLength > 0) {
		this.text = this.text.substr(0, this.maxLength);
	}

	this.text = strUtil.stylizeString(this.text, this.hasFocus ? this.focusTextStyle : this.textStyle);	

	/*if(!this.multiLine && !this.dimens.width) {
		this.dimens.width = this.text.length;
	}*/

	if(!this.multiLine) {
		if(this.resizable) {
			this.dimens.width = this.text.length + widthDelta;
		}
	}

	this.redraw();
};

TextView.prototype.clearText = function() {
	this.setText('');
};