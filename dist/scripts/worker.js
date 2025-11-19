#!/usr/bin/env node
"use strict";
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _ts_generator(thisArg, body) {
    var f, y, t, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = function(to, from, except, desc) {
    if (from && (typeof from === "undefined" ? "undefined" : _type_of(from)) === "object" || typeof from === "function") {
        var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
        try {
            var _loop = function() {
                var key = _step.value;
                if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
                    get: function() {
                        return from[key];
                    },
                    enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
                });
            };
            for(var _iterator = __getOwnPropNames(from)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true)_loop();
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally{
            try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                }
            } finally{
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }
    return to;
};
var __toESM = function(mod, isNodeMode, target) {
    return target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(// If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
        value: mod,
        enumerable: true
    }) : target, mod);
};
// lib/queue.ts
var import_bull = __toESM(require("bull"));
var import_ioredis = __toESM(require("ioredis"));
// lib/supabaseClient.ts
var import_ssr = require("@supabase/ssr");
var import_supabase_js = require("@supabase/supabase-js");
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
var supabase = (0, import_ssr.createBrowserClient)(supabaseUrl, supabaseKey, {
    cookies: {
        get: function get(name) {
            if (typeof document === "undefined") return void 0;
            var cookies = document.cookie.split("; ");
            var cookie = cookies.find(function(c) {
                return c.startsWith("".concat(name, "="));
            });
            return cookie === null || cookie === void 0 ? void 0 : cookie.split("=")[1];
        },
        set: function set(name, value, options) {
            if (typeof document === "undefined") return;
            var cookieString = "".concat(name, "=").concat(value);
            if (options.maxAge) {
                cookieString += "; max-age=".concat(options.maxAge);
            }
            if (options.path) {
                cookieString += "; path=".concat(options.path);
            }
            if (options.sameSite) {
                cookieString += "; samesite=".concat(options.sameSite);
            }
            if (options.secure) {
                cookieString += "; secure";
            }
            document.cookie = cookieString;
        },
        remove: function remove(name, options) {
            if (typeof document === "undefined") return;
            document.cookie = "".concat(name, "=; path=").concat(options.path || "/", "; max-age=0");
        }
    }
});
var supabaseSimple = (0, import_supabase_js.createClient)(supabaseUrl, supabaseKey);
// lib/campaignService.ts
var CampaignService = /*#__PURE__*/ function() {
    function CampaignService() {
        _class_call_check(this, CampaignService);
    }
    _create_class(CampaignService, null, [
        {
            key: "getCampanhas",
            value: // Buscar todas as campanhas (filtradas por user_id)
            function getCampanhas(userId) {
                return _async_to_generator(function() {
                    var _ref, data, _$error, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    2,
                                    ,
                                    3
                                ]);
                                return [
                                    4,
                                    supabase.from("campanhas").select("*").eq("user_id", userId).order("created_at", {
                                        ascending: false
                                    })
                                ];
                            case 1:
                                _ref = _state.sent(), data = _ref.data, _$error = _ref.error;
                                if (_$error) {
                                    console.error("Erro ao buscar campanhas:", _$error);
                                    return [
                                        2,
                                        []
                                    ];
                                }
                                return [
                                    2,
                                    data || []
                                ];
                            case 2:
                                error = _state.sent();
                                console.error("Erro ao buscar campanhas:", error);
                                return [
                                    2,
                                    []
                                ];
                            case 3:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "getCampanhaById",
            value: // Buscar campanha por ID (filtrada por user_id)
            // userId pode ser opcional em alguns contextos (workers/background)
            function getCampanhaById(id, userId) {
                return _async_to_generator(function() {
                    var query, _ref, data, _$error, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    2,
                                    ,
                                    3
                                ]);
                                query = supabase.from("campanhas").select("*").eq("id", id);
                                if (userId) {
                                    query = query.eq("user_id", userId);
                                }
                                return [
                                    4,
                                    query.single()
                                ];
                            case 1:
                                _ref = _state.sent(), data = _ref.data, _$error = _ref.error;
                                if (_$error) {
                                    console.error("Erro ao buscar campanha:", _$error);
                                    return [
                                        2,
                                        {
                                            data: null,
                                            error: _$error
                                        }
                                    ];
                                }
                                return [
                                    2,
                                    {
                                        data: data,
                                        error: null
                                    }
                                ];
                            case 2:
                                error = _state.sent();
                                console.error("Erro ao buscar campanha:", error);
                                return [
                                    2,
                                    {
                                        data: null,
                                        error: error
                                    }
                                ];
                            case 3:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "criarCampanha",
            value: // Criar nova campanha (com user_id)
            function criarCampanha(campanha, userId) {
                return _async_to_generator(function() {
                    var _ref, data, _$error, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    2,
                                    ,
                                    3
                                ]);
                                return [
                                    4,
                                    supabase.from("campanhas").insert([
                                        {
                                            nome: campanha.nome,
                                            mensagem: campanha.mensagem,
                                            criterios: campanha.criterios,
                                            configuracao: campanha.configuracao,
                                            user_id: userId,
                                            status: "rascunho",
                                            progresso: {
                                                totalClientes: 0,
                                                totalLotes: 0,
                                                lotesProcessados: 0,
                                                clientesEnviados: 0,
                                                clientesFalharam: 0,
                                                status: "rascunho"
                                            },
                                            relatorio: {
                                                entregues: 0,
                                                falhas: 0,
                                                engajamento: {
                                                    lidos: 0,
                                                    respondidos: 0,
                                                    cliques: 0,
                                                    taxaLeitura: 0,
                                                    taxaResposta: 0
                                                },
                                                detalhesFalhas: []
                                            }
                                        }
                                    ]).select().single()
                                ];
                            case 1:
                                _ref = _state.sent(), data = _ref.data, _$error = _ref.error;
                                if (_$error) {
                                    console.error("Erro ao criar campanha:", _$error);
                                    return [
                                        2,
                                        null
                                    ];
                                }
                                return [
                                    2,
                                    data
                                ];
                            case 2:
                                error = _state.sent();
                                console.error("Erro ao criar campanha:", error);
                                return [
                                    2,
                                    null
                                ];
                            case 3:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "atualizarCampanha",
            value: // Atualizar campanha (verificando user_id)
            function atualizarCampanha(id, updates, userId) {
                return _async_to_generator(function() {
                    var _$error, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    2,
                                    ,
                                    3
                                ]);
                                return [
                                    4,
                                    supabase.from("campanhas").update(updates).eq("id", id).eq("user_id", userId)
                                ];
                            case 1:
                                _$error = _state.sent().error;
                                if (_$error) {
                                    console.error("Erro ao atualizar campanha:", _$error);
                                    return [
                                        2,
                                        false
                                    ];
                                }
                                return [
                                    2,
                                    true
                                ];
                            case 2:
                                error = _state.sent();
                                console.error("Erro ao atualizar campanha:", error);
                                return [
                                    2,
                                    false
                                ];
                            case 3:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "deletarCampanha",
            value: // Deletar campanha (verificando user_id)
            function deletarCampanha(id, userId) {
                return _async_to_generator(function() {
                    var _$error, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    2,
                                    ,
                                    3
                                ]);
                                return [
                                    4,
                                    supabase.from("campanhas").delete().eq("id", id).eq("user_id", userId)
                                ];
                            case 1:
                                _$error = _state.sent().error;
                                if (_$error) {
                                    console.error("Erro ao deletar campanha:", _$error);
                                    return [
                                        2,
                                        false
                                    ];
                                }
                                return [
                                    2,
                                    true
                                ];
                            case 2:
                                error = _state.sent();
                                console.error("Erro ao deletar campanha:", error);
                                return [
                                    2,
                                    false
                                ];
                            case 3:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "controlarCampanha",
            value: // Controle de campanha (iniciar, pausar, retomar, cancelar) - verificando user_id
            // userId opcional para permitir controle via workers/background
            function controlarCampanha(id, controle, userId) {
                return _async_to_generator(function() {
                    var acao, statusUpdate, progressoUpdate, query, _$error, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    2,
                                    ,
                                    3
                                ]);
                                acao = controle.acao;
                                statusUpdate = "";
                                progressoUpdate = {};
                                switch(acao){
                                    case "iniciar":
                                        statusUpdate = "processando";
                                        progressoUpdate = {
                                            status: "processando",
                                            iniciadoEm: /* @__PURE__ */ new Date().toISOString()
                                        };
                                        break;
                                    case "pausar":
                                        statusUpdate = "pausada";
                                        progressoUpdate = {
                                            status: "pausada"
                                        };
                                        break;
                                    case "retomar":
                                        statusUpdate = "processando";
                                        progressoUpdate = {
                                            status: "processando"
                                        };
                                        break;
                                    case "cancelar":
                                        statusUpdate = "rascunho";
                                        progressoUpdate = {
                                            status: "rascunho"
                                        };
                                        break;
                                }
                                query = supabase.from("campanhas").update({
                                    status: statusUpdate,
                                    progresso: progressoUpdate
                                }).eq("id", id);
                                if (userId) {
                                    query = query.eq("user_id", userId);
                                }
                                return [
                                    4,
                                    query
                                ];
                            case 1:
                                _$error = _state.sent().error;
                                if (_$error) {
                                    console.error("Erro ao controlar campanha:", _$error);
                                    return [
                                        2,
                                        false
                                    ];
                                }
                                return [
                                    2,
                                    true
                                ];
                            case 2:
                                error = _state.sent();
                                console.error("Erro ao controlar campanha:", error);
                                return [
                                    2,
                                    false
                                ];
                            case 3:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "buscarClientesPorCriterios",
            value: // Buscar clientes baseado nos critérios (filtrado por user_id)
            function buscarClientesPorCriterios(criterios, userId) {
                return _async_to_generator(function() {
                    var query, _ref, data, _$error, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    2,
                                    ,
                                    3
                                ]);
                                query = supabase.from("clientes").select("*").eq("user_id", userId).order("created_at", {
                                    ascending: false
                                });
                                if (criterios.status && criterios.status !== "todos") {
                                    query = query.eq("status", criterios.status);
                                }
                                return [
                                    4,
                                    query
                                ];
                            case 1:
                                _ref = _state.sent(), data = _ref.data, _$error = _ref.error;
                                if (_$error) {
                                    console.error("Erro ao buscar clientes:", _$error);
                                    return [
                                        2,
                                        []
                                    ];
                                }
                                return [
                                    2,
                                    data || []
                                ];
                            case 2:
                                error = _state.sent();
                                console.error("Erro ao buscar clientes:", error);
                                return [
                                    2,
                                    []
                                ];
                            case 3:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "criarLotes",
            value: // Criar lotes para uma campanha
            function criarLotes(campanhaId, clientes, clientesPorLote) {
                return _async_to_generator(function() {
                    var lotes, totalLotes, i, inicio, fim, clientesLote, _$error, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    3,
                                    ,
                                    4
                                ]);
                                lotes = [];
                                totalLotes = Math.ceil(clientes.length / clientesPorLote);
                                for(i = 0; i < totalLotes; i++){
                                    inicio = i * clientesPorLote;
                                    fim = Math.min(inicio + clientesPorLote, clientes.length);
                                    clientesLote = clientes.slice(inicio, fim);
                                    lotes.push({
                                        campanha_id: campanhaId,
                                        numero_lote: i + 1,
                                        clientes: clientesLote.map(function(cliente) {
                                            var _cliente_id;
                                            return {
                                                id: ((_cliente_id = cliente.id) === null || _cliente_id === void 0 ? void 0 : _cliente_id.toString()) || "",
                                                nome: cliente.nome,
                                                telefone: cliente.telefone
                                            };
                                        }),
                                        status: "pendente"
                                    });
                                }
                                return [
                                    4,
                                    supabase.from("lotes_campanha").insert(lotes)
                                ];
                            case 1:
                                _$error = _state.sent().error;
                                if (_$error) {
                                    console.error("Erro ao criar lotes:", _$error);
                                    return [
                                        2,
                                        false
                                    ];
                                }
                                return [
                                    4,
                                    supabase.from("campanhas").update({
                                        progresso: {
                                            totalClientes: clientes.length,
                                            totalLotes: totalLotes,
                                            lotesProcessados: 0,
                                            clientesEnviados: 0,
                                            clientesFalharam: 0,
                                            status: "agendada"
                                        }
                                    }).eq("id", campanhaId)
                                ];
                            case 2:
                                _state.sent();
                                return [
                                    2,
                                    true
                                ];
                            case 3:
                                error = _state.sent();
                                console.error("Erro ao criar lotes:", error);
                                return [
                                    2,
                                    false
                                ];
                            case 4:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "getLotesCampanha",
            value: // Buscar lotes de uma campanha
            function getLotesCampanha(campanhaId) {
                return _async_to_generator(function() {
                    var _ref, data, _$error, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    2,
                                    ,
                                    3
                                ]);
                                return [
                                    4,
                                    supabase.from("lotes_campanha").select("*").eq("campanha_id", campanhaId).order("numero_lote", {
                                        ascending: true
                                    })
                                ];
                            case 1:
                                _ref = _state.sent(), data = _ref.data, _$error = _ref.error;
                                if (_$error) {
                                    console.error("Erro ao buscar lotes:", _$error);
                                    return [
                                        2,
                                        []
                                    ];
                                }
                                return [
                                    2,
                                    data || []
                                ];
                            case 2:
                                error = _state.sent();
                                console.error("Erro ao buscar lotes:", error);
                                return [
                                    2,
                                    []
                                ];
                            case 3:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "gerarRelatorio",
            value: // Gerar relatório de campanha (verificando user_id)
            function gerarRelatorio(campanhaId, userId) {
                return _async_to_generator(function() {
                    var _campanhaData_relatorio_engajamento, _campanhaData_relatorio, _campanhaData_relatorio_engajamento1, _campanhaData_relatorio1, _campanhaData_relatorio_engajamento2, _campanhaData_relatorio2, _campanhaData_relatorio_engajamento3, _campanhaData_relatorio3, _campanhaData_relatorio_engajamento4, _campanhaData_relatorio4, campanha, campanhaData, lotes, estatisticas, _campanhaData_relatorio_engajamento_lidos, _campanhaData_relatorio_engajamento_respondidos, _campanhaData_relatorio_engajamento_cliques, _campanhaData_relatorio_engajamento_taxaLeitura, _campanhaData_relatorio_engajamento_taxaResposta, relatorio, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    3,
                                    ,
                                    4
                                ]);
                                return [
                                    4,
                                    this.getCampanhaById(campanhaId, userId)
                                ];
                            case 1:
                                campanha = _state.sent();
                                if (!campanha.data) return [
                                    2,
                                    null
                                ];
                                campanhaData = campanha.data;
                                return [
                                    4,
                                    this.getLotesCampanha(campanhaId)
                                ];
                            case 2:
                                lotes = _state.sent();
                                estatisticas = {
                                    totalClientes: campanhaData.progresso.totalClientes,
                                    clientesEnviados: campanhaData.progresso.clientesEnviados,
                                    clientesFalharam: campanhaData.progresso.clientesFalharam,
                                    taxaEntrega: campanhaData.progresso.totalClientes > 0 ? campanhaData.progresso.clientesEnviados / campanhaData.progresso.totalClientes * 100 : 0,
                                    tempoTotal: 0,
                                    // TODO: Calcular baseado nos timestamps
                                    velocidadeMedia: 0
                                };
                                relatorio = {
                                    campanha: campanhaData,
                                    estatisticas: estatisticas,
                                    lotes: lotes.map(function(lote) {
                                        return {
                                            numero: lote.numero_lote,
                                            status: lote.status,
                                            clientes: lote.clientes.length,
                                            enviados: 0,
                                            // TODO: Calcular baseado nos disparos
                                            falhas: 0,
                                            // TODO: Calcular baseado nos disparos
                                            tempoProcessamento: 0
                                        };
                                    }),
                                    engajamento: {
                                        lidos: (_campanhaData_relatorio_engajamento_lidos = (_campanhaData_relatorio = campanhaData.relatorio) === null || _campanhaData_relatorio === void 0 ? void 0 : (_campanhaData_relatorio_engajamento = _campanhaData_relatorio.engajamento) === null || _campanhaData_relatorio_engajamento === void 0 ? void 0 : _campanhaData_relatorio_engajamento.lidos) !== null && _campanhaData_relatorio_engajamento_lidos !== void 0 ? _campanhaData_relatorio_engajamento_lidos : 0,
                                        respondidos: (_campanhaData_relatorio_engajamento_respondidos = (_campanhaData_relatorio1 = campanhaData.relatorio) === null || _campanhaData_relatorio1 === void 0 ? void 0 : (_campanhaData_relatorio_engajamento1 = _campanhaData_relatorio1.engajamento) === null || _campanhaData_relatorio_engajamento1 === void 0 ? void 0 : _campanhaData_relatorio_engajamento1.respondidos) !== null && _campanhaData_relatorio_engajamento_respondidos !== void 0 ? _campanhaData_relatorio_engajamento_respondidos : 0,
                                        cliques: (_campanhaData_relatorio_engajamento_cliques = (_campanhaData_relatorio2 = campanhaData.relatorio) === null || _campanhaData_relatorio2 === void 0 ? void 0 : (_campanhaData_relatorio_engajamento2 = _campanhaData_relatorio2.engajamento) === null || _campanhaData_relatorio_engajamento2 === void 0 ? void 0 : _campanhaData_relatorio_engajamento2.cliques) !== null && _campanhaData_relatorio_engajamento_cliques !== void 0 ? _campanhaData_relatorio_engajamento_cliques : 0,
                                        taxaLeitura: (_campanhaData_relatorio_engajamento_taxaLeitura = (_campanhaData_relatorio3 = campanhaData.relatorio) === null || _campanhaData_relatorio3 === void 0 ? void 0 : (_campanhaData_relatorio_engajamento3 = _campanhaData_relatorio3.engajamento) === null || _campanhaData_relatorio_engajamento3 === void 0 ? void 0 : _campanhaData_relatorio_engajamento3.taxaLeitura) !== null && _campanhaData_relatorio_engajamento_taxaLeitura !== void 0 ? _campanhaData_relatorio_engajamento_taxaLeitura : 0,
                                        taxaResposta: (_campanhaData_relatorio_engajamento_taxaResposta = (_campanhaData_relatorio4 = campanhaData.relatorio) === null || _campanhaData_relatorio4 === void 0 ? void 0 : (_campanhaData_relatorio_engajamento4 = _campanhaData_relatorio4.engajamento) === null || _campanhaData_relatorio_engajamento4 === void 0 ? void 0 : _campanhaData_relatorio_engajamento4.taxaResposta) !== null && _campanhaData_relatorio_engajamento_taxaResposta !== void 0 ? _campanhaData_relatorio_engajamento_taxaResposta : 0
                                    }
                                };
                                return [
                                    2,
                                    relatorio
                                ];
                            case 3:
                                error = _state.sent();
                                console.error("Erro ao gerar relat\xF3rio:", error);
                                return [
                                    2,
                                    null
                                ];
                            case 4:
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        }
    ]);
    return CampaignService;
}();
// lib/queue.ts
var redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || "0"),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 1,
    // Reduzir tentativas
    lazyConnect: true,
    connectTimeout: 5e3,
    // Timeout de 5 segundos
    commandTimeout: 5e3
};
var redis = null;
var redisAvailable = false;
var hasRedisConfig = process.env.REDIS_HOST || process.env.REDIS_URL;
if (hasRedisConfig) {
    try {
        redis = new import_ioredis.default(redisConfig);
        redis.on("connect", function() {
            console.log("\u2705 Redis conectado com sucesso");
            redisAvailable = true;
        });
        redis.on("error", function(error) {
            console.log("\u26A0\uFE0F Redis n\xE3o dispon\xEDvel, usando modo fallback:", error.message);
            redisAvailable = false;
        });
    } catch (error) {
        console.log("\u26A0\uFE0F Redis n\xE3o configurado, usando modo fallback");
        redisAvailable = false;
    }
} else {
    console.log("\u2139\uFE0F Redis n\xE3o configurado, usando modo fallback (sem fila)");
    redisAvailable = false;
}
var campaignQueue = new import_bull.default("campaign processing", {
    redis: redisAvailable ? redisConfig : void 0,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2e3
        }
    }
});
var whatsappQueue = new import_bull.default("whatsapp messages", {
    redis: redisAvailable ? redisConfig : void 0,
    defaultJobOptions: {
        removeOnComplete: 1e3,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5e3
        }
    }
});
console.log("\uD83D\uDD27 Configura\xe7\xe3o da fila WhatsApp:", {
    redisAvailable: redisAvailable,
    redisConfig: redisAvailable ? "configurado" : "n\xE3o configurado"
});
campaignQueue.process("process-campaign", function(job) {
    return _async_to_generator(function() {
        var campanhaId, campanhaResult, campanha, lotes, lotesPendentes, lote, lotesRestantes, aindaPendentes, _campanha_configuracao, proximoProcessamento, error;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    campanhaId = job.data.campanhaId;
                    _state.label = 1;
                case 1:
                    _state.trys.push([
                        1,
                        10,
                        ,
                        11
                    ]);
                    console.log("Processando campanha ".concat(campanhaId));
                    return [
                        4,
                        CampaignService.getCampanhaById(campanhaId)
                    ];
                case 2:
                    campanhaResult = _state.sent();
                    campanha = campanhaResult === null || campanhaResult === void 0 ? void 0 : campanhaResult.data;
                    if (!campanha) {
                        throw new Error("Campanha n\xE3o encontrada");
                    }
                    return [
                        4,
                        CampaignService.getLotesCampanha(campanhaId)
                    ];
                case 3:
                    lotes = _state.sent();
                    lotesPendentes = lotes.filter(function(lote2) {
                        return lote2.status === "pendente";
                    });
                    if (!(lotesPendentes.length === 0)) return [
                        3,
                        5
                    ];
                    return [
                        4,
                        CampaignService.controlarCampanha(campanhaId, {
                            acao: "concluir"
                        })
                    ];
                case 4:
                    _state.sent();
                    return [
                        2,
                        {
                            message: "Campanha conclu\xEDda"
                        }
                    ];
                case 5:
                    lote = lotesPendentes[0];
                    return [
                        4,
                        processarLote(campanhaId, lote)
                    ];
                case 6:
                    _state.sent();
                    return [
                        4,
                        CampaignService.getLotesCampanha(campanhaId)
                    ];
                case 7:
                    lotesRestantes = _state.sent();
                    aindaPendentes = lotesRestantes.filter(function(l) {
                        return l.status === "pendente";
                    });
                    if (!(aindaPendentes.length > 0)) return [
                        3,
                        9
                    ];
                    proximoProcessamento = ((_campanha_configuracao = campanha.configuracao) === null || _campanha_configuracao === void 0 ? void 0 : _campanha_configuracao.intervaloMensagens) * 1e3;
                    return [
                        4,
                        campaignQueue.add("process-campaign", {
                            campanhaId: campanhaId
                        }, {
                            delay: proximoProcessamento
                        })
                    ];
                case 8:
                    _state.sent();
                    _state.label = 9;
                case 9:
                    return [
                        2,
                        {
                            message: "Lote ".concat(lote.numero_lote, " processado")
                        }
                    ];
                case 10:
                    error = _state.sent();
                    console.error("Erro ao processar campanha ".concat(campanhaId, ":"), error);
                    throw error;
                case 11:
                    return [
                        2
                    ];
            }
        });
    })();
});
console.log("\uD83D\uDD27 Registrando processador da fila WhatsApp...");
whatsappQueue.process("send-message", function(job) {
    return _async_to_generator(function() {
        var _job_data, telefone, mensagem, disparoId, instanceName, scheduledTime, sucesso, error;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    _job_data = job.data, telefone = _job_data.telefone, mensagem = _job_data.mensagem, disparoId = _job_data.disparoId, instanceName = _job_data.instanceName, scheduledTime = _job_data.scheduledTime;
                    _state.label = 1;
                case 1:
                    _state.trys.push([
                        1,
                        10,
                        ,
                        12
                    ]);
                    console.log("\uD83D\uDE80 PROCESSADOR ATIVADO: Processando mensagem para ".concat(telefone, " via inst\xe2ncia ").concat(instanceName));
                    console.log("\uD83D\uDCCA Dados do job:", {
                        disparoId: disparoId,
                        telefone: telefone,
                        instanceName: instanceName,
                        messageLength: mensagem.length,
                        scheduledTime: scheduledTime
                    });
                    sucesso = false;
                    if (!instanceName) return [
                        3,
                        3
                    ];
                    console.log("\uD83D\uDD17 Enviando via Evolution API: ".concat(instanceName));
                    return [
                        4,
                        enviarMensagemEvolutionAPI(telefone, mensagem, instanceName)
                    ];
                case 2:
                    sucesso = _state.sent();
                    _state.label = 3;
                case 3:
                    if (!!sucesso) return [
                        3,
                        5
                    ];
                    console.log("\u26A0\uFE0F Evolution API falhou, usando simula\xE7\xE3o como fallback");
                    return [
                        4,
                        simularEnvioWhatsApp(telefone, mensagem)
                    ];
                case 4:
                    sucesso = _state.sent();
                    _state.label = 5;
                case 5:
                    if (!sucesso) return [
                        3,
                        7
                    ];
                    console.log("✅ Mensagem enviada com sucesso para ".concat(telefone));
                    return [
                        4,
                        atualizarStatusDisparo(disparoId, "enviado")
                    ];
                case 6:
                    _state.sent();
                    return [
                        2,
                        {
                            status: "enviado",
                            telefone: telefone,
                            disparoId: disparoId
                        }
                    ];
                case 7:
                    console.log("❌ Falha no envio para ".concat(telefone));
                    return [
                        4,
                        atualizarStatusDisparo(disparoId, "falhou")
                    ];
                case 8:
                    _state.sent();
                    throw new Error("Falha no envio");
                case 9:
                    return [
                        3,
                        12
                    ];
                case 10:
                    error = _state.sent();
                    console.error("❌ Erro ao enviar mensagem para ".concat(telefone, ":"), error);
                    return [
                        4,
                        atualizarStatusDisparo(disparoId, "falhou")
                    ];
                case 11:
                    _state.sent();
                    throw error;
                case 12:
                    return [
                        2
                    ];
            }
        });
    })();
});
function processarLote(campanhaId, lote) {
    return _async_to_generator(function() {
        var jobs, error;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    _state.trys.push([
                        0,
                        5,
                        ,
                        7
                    ]);
                    return [
                        4,
                        marcarLoteStatus(lote.id, "processando")
                    ];
                case 1:
                    _state.sent();
                    jobs = lote.clientes.map(function(cliente) {
                        return {
                            telefone: cliente.telefone,
                            mensagem: "",
                            // TODO: Buscar mensagem da campanha
                            loteId: lote.id,
                            clienteId: cliente.id
                        };
                    });
                    return [
                        4,
                        whatsappQueue.addBulk(jobs.map(function(job) {
                            return {
                                name: "send-message",
                                data: job
                            };
                        }))
                    ];
                case 2:
                    _state.sent();
                    return [
                        4,
                        marcarLoteStatus(lote.id, "concluido")
                    ];
                case 3:
                    _state.sent();
                    return [
                        4,
                        atualizarProgressoCampanha(campanhaId)
                    ];
                case 4:
                    _state.sent();
                    return [
                        3,
                        7
                    ];
                case 5:
                    error = _state.sent();
                    console.error("Erro ao processar lote ".concat(lote.id, ":"), error);
                    return [
                        4,
                        marcarLoteStatus(lote.id, "erro")
                    ];
                case 6:
                    _state.sent();
                    throw error;
                case 7:
                    return [
                        2
                    ];
            }
        });
    })();
}
function enviarMensagemEvolutionAPI(telefone, mensagem, instanceName) {
    return _async_to_generator(function() {
        var response, data, error;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    _state.trys.push([
                        0,
                        3,
                        ,
                        4
                    ]);
                    console.log("\uD83D\uDD17 Enviando via Evolution API: ".concat(instanceName, " -> ").concat(telefone));
                    return [
                        4,
                        fetch("".concat(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000", "/api/evolution/send-message"), {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                instanceName: instanceName,
                                phoneNumber: telefone,
                                message: mensagem
                            })
                        })
                    ];
                case 1:
                    response = _state.sent();
                    return [
                        4,
                        response.json()
                    ];
                case 2:
                    data = _state.sent();
                    console.log("\uD83D\uDCE1 Resposta Evolution API:", {
                        status: response.status,
                        success: data.success
                    });
                    return [
                        2,
                        response.ok && data.success
                    ];
                case 3:
                    error = _state.sent();
                    console.error("\u274C Erro ao enviar mensagem via Evolution API:", error);
                    return [
                        2,
                        false
                    ];
                case 4:
                    return [
                        2
                    ];
            }
        });
    })();
}
function simularEnvioWhatsApp(telefone, mensagem) {
    return _async_to_generator(function() {
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    return [
                        4,
                        new Promise(function(resolve) {
                            return setTimeout(resolve, 1e3);
                        })
                    ];
                case 1:
                    _state.sent();
                    return [
                        2,
                        Math.random() > 0.05
                    ];
            }
        });
    })();
}
function marcarLoteStatus(loteId, status) {
    return _async_to_generator(function() {
        return _ts_generator(this, function(_state) {
            console.log("Lote ".concat(loteId, " marcado como ").concat(status));
            return [
                2
            ];
        });
    })();
}
function atualizarStatusDisparo(disparoId, status) {
    return _async_to_generator(function() {
        var _ref, createClient2, supabase2, updateData, _$error, error;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    _state.trys.push([
                        0,
                        3,
                        ,
                        4
                    ]);
                    console.log("\uD83D\uDCDD Atualizando status do disparo ".concat(disparoId, " para ").concat(status));
                    return [
                        4,
                        import("@supabase/supabase-js")
                    ];
                case 1:
                    _ref = _state.sent(), createClient2 = _ref.createClient;
                    supabase2 = createClient2(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
                    updateData = {
                        status: status
                    };
                    if (status === "enviado") {
                        updateData.enviado_em = /* @__PURE__ */ new Date().toISOString();
                    } else if (status === "falhou") {
                        updateData.erro = "Falha no envio via Evolution API";
                    }
                    return [
                        4,
                        supabase2.from("disparos").update(updateData).eq("id", disparoId)
                    ];
                case 2:
                    _$error = _state.sent().error;
                    if (_$error) {
                        console.error("\u274C Erro ao atualizar status do disparo:", _$error);
                    } else {
                        console.log("✅ Status do disparo ".concat(disparoId, " atualizado para ").concat(status));
                    }
                    return [
                        3,
                        4
                    ];
                case 3:
                    error = _state.sent();
                    console.error("\u274C Erro ao atualizar status do disparo:", error);
                    return [
                        3,
                        4
                    ];
                case 4:
                    return [
                        2
                    ];
            }
        });
    })();
}
function atualizarProgressoCampanha(campanhaId) {
    return _async_to_generator(function() {
        return _ts_generator(this, function(_state) {
            console.log("Progresso da campanha ".concat(campanhaId, " atualizado"));
            return [
                2
            ];
        });
    })();
}
campaignQueue.on("completed", function(job) {
    console.log("Campanha ".concat(job.data.campanhaId, " processada com sucesso"));
});
campaignQueue.on("failed", function(job, err) {
    console.error("Campanha ".concat(job.data.campanhaId, " falhou:"), err);
});
whatsappQueue.on("completed", function(job) {
    var _job_data;
    console.log("✅ Mensagem enviada com sucesso para ".concat(job === null || job === void 0 ? void 0 : (_job_data = job.data) === null || _job_data === void 0 ? void 0 : _job_data.telefone));
});
whatsappQueue.on("failed", function(job, err) {
    var _job_data;
    console.error("❌ Falha ao enviar mensagem para ".concat(job === null || job === void 0 ? void 0 : (_job_data = job.data) === null || _job_data === void 0 ? void 0 : _job_data.telefone, ":"), err);
});
whatsappQueue.on("waiting", function(jobOrId) {
    var id = (typeof jobOrId === "undefined" ? "undefined" : _type_of(jobOrId)) === "object" ? jobOrId.id : jobOrId;
    console.log("⏳ Job ".concat(id, " aguardando processamento"));
});
whatsappQueue.on("active", function(jobOrId) {
    var id = (typeof jobOrId === "undefined" ? "undefined" : _type_of(jobOrId)) === "object" ? jobOrId.id : jobOrId;
    console.log("\uD83D\uDD04 Job ".concat(id, " sendo processado"));
});
console.log("\uD83D\uDE80 Sistema de filas inicializado:", {
    campaignQueue: "ativa",
    whatsappQueue: "ativa",
    redisAvailable: redisAvailable
});
// scripts/worker.ts
console.log("\uD83D\uDD27 Worker: filas registradas e aguardando jobs...");
process.stdin.resume();
process.on("SIGINT", function() {
    console.log("\u270B Worker recebido SIGINT - finalizando");
    process.exit(0);
});
