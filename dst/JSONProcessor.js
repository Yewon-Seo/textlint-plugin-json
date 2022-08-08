"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JSONProcessor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jsonToAst = require("json-to-ast");

var _jsonToAst2 = _interopRequireDefault(_jsonToAst);

var _astNodeTypes = require("@textlint/ast-node-types");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var config;

var JSONProcessor = exports.JSONProcessor = function () {
    function JSONProcessor() {
        config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, JSONProcessor);
        this.config = config;
    }
    _createClass(JSONProcessor, [{
        key: "availableExtensions",
        value: function availableExtensions() {
            return [".json"].concat(this.config.extensions ? this.config.extensions : []);
        }
    }, {
        key: "processor",
        value: function processor(_extension) {
            return {
                preProcess: function preProcess(text) {
                    var ast = (0, _jsonToAst2.default)(text);
                    var fixed_ast = delete_offset(ast);
                    ast = convert(fixed_ast);
                    return ast;
                },
                postProcess: function postProcess(messages, filePath) {
                    return {
                        messages: messages,
                        filePath: filePath ? filePath : "<json>"
                    };
                }
            };
        }
    }]);

    return JSONProcessor;
}();

function delete_offset(node) {

    let prop_names = Object.keys(config.key).map(item => config.key[item]);
    switch (node.type) {
        case "Object":
            node.children.map(function (child) {
                return delete_offset(child);
            });
            break;
        case "Property":
            if (!prop_names.includes(node.key.value)) {
                delete_offset(node.value)
            }
            break;
        case "Array":
            node.children.map(function (child) {
                return delete_offset(child);
            });
            break;
        case "Identifier":
            node.loc.start.offset = 0
            node.loc.end.offset = 0
            break; 
        case "Literal":
            node.loc.start.offset = 0
            node.loc.end.offset = 0
            break;
        default:
            break;
    }
    return node;
}

function convert(node) {
    switch (node.type) {
        case "Object":
            node.type = _astNodeTypes.ASTNodeTypes.Document;
            node.children = node.children.map(function (child) {
                return convert(child);
            });
            break;
        case "Property":
            node.type = _astNodeTypes.ASTNodeTypes.Document;
            node.children = [convert(node.value)];
            delete node.key;
            delete node.value; 
            break;
        case "Array":
            node.type = _astNodeTypes.ASTNodeTypes.List;
            node.children = node.children.map(function (child) {
                return convert(child);
            });
            break;
        case "Identifier":
                node.type = _astNodeTypes.ASTNodeTypes.Str;
            break;
        case "Literal":
                node.type = _astNodeTypes.ASTNodeTypes.Str;
            break;
        default:
            // nothing to do
            break;
    }
    node.range = [node.loc.start.offset, node.loc.end.offset];
    return node;
}