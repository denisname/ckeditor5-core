/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals window, setTimeout */

import Editor from '../../src/editor/editor';
import Plugin from '../../src/plugin';
import Config from '@ckeditor/ckeditor5-utils/src/config';
import EditingController from '@ckeditor/ckeditor5-engine/src/controller/editingcontroller';
import PluginCollection from '../../src/plugincollection';
import CommandCollection from '../../src/commandcollection';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';
import Locale from '@ckeditor/ckeditor5-utils/src/locale';
import Command from '../../src/command';
import EditingKeystrokeHandler from '../../src/editingkeystrokehandler';

class PluginA extends Plugin {
	constructor( editor ) {
		super( editor );
		this.init = sinon.spy().named( 'A' );
		this.afterInit = sinon.spy().named( 'A-after' );
	}

	static get pluginName() {
		return 'A';
	}
}

class PluginB extends Plugin {
	constructor( editor ) {
		super( editor );
		this.init = sinon.spy().named( 'B' );
		this.afterInit = sinon.spy().named( 'B-after' );
	}

	static get pluginName() {
		return 'B';
	}
}

class PluginC extends Plugin {
	constructor( editor ) {
		super( editor );
		this.init = sinon.spy().named( 'C' );
		this.afterInit = sinon.spy().named( 'C-after' );
	}

	static get pluginName() {
		return 'C';
	}

	static get requires() {
		return [ PluginB ];
	}
}

class PluginD extends Plugin {
	constructor( editor ) {
		super( editor );
		this.init = sinon.spy().named( 'D' );
		this.afterInit = sinon.spy().named( 'D-after' );
	}

	static get pluginName() {
		return 'D';
	}

	static get requires() {
		return [ PluginC ];
	}
}

class PluginE {
	constructor( editor ) {
		this.editor = editor;
		this.init = sinon.spy().named( 'E' );
	}

	static get pluginName() {
		return 'E';
	}
}

class PluginF {
	constructor( editor ) {
		this.editor = editor;
		this.afterInit = sinon.spy().named( 'F-after' );
	}

	static get pluginName() {
		return 'F';
	}
}

describe( 'Editor', () => {
	afterEach( () => {
		delete Editor.builtinPlugins;
		delete Editor.defaultConfig;
	} );

	it( 'imports the version helper', () => {
		expect( window.CKEDITOR_VERSION ).to.be.a( 'string' );
	} );

	describe( 'constructor()', () => {
		it( 'should create a new editor instance', () => {
			const editor = new Editor();

			expect( editor.config ).to.be.an.instanceof( Config );
			expect( editor.commands ).to.be.an.instanceof( CommandCollection );
			expect( editor.editing ).to.be.instanceof( EditingController );
			expect( editor.keystrokes ).to.be.instanceof( EditingKeystrokeHandler );

			expect( editor.plugins ).to.be.an.instanceof( PluginCollection );
			expect( getPlugins( editor ) ).to.be.empty;
		} );

		it( 'should extend an editor configuration using built in config', () => {
			Editor.defaultConfig = {
				foo: {
					a: 1,
					b: 2
				}
			};

			const editor = new Editor( {
				bar: 'foo',
				foo: {
					c: 3
				},
			} );

			expect( editor.config.get( 'foo' ) ).to.deep.equal( {
				a: 1,
				b: 2,
				c: 3
			} );

			expect( editor.config.get( 'bar' ) ).to.equal( 'foo' );
		} );

		it( 'should bind editing.view.document#isReadOnly to the editor', () => {
			const editor = new Editor();

			editor.isReadOnly = false;

			expect( editor.editing.view.document.isReadOnly ).to.false;

			editor.isReadOnly = true;

			expect( editor.editing.view.document.isReadOnly ).to.true;
		} );

		it( 'should activate #keystrokes', () => {
			const spy = sinon.spy( EditingKeystrokeHandler.prototype, 'listenTo' );
			const editor = new Editor();

			sinon.assert.calledWith( spy, editor.editing.view.document );
		} );
	} );

	describe( 'plugins', () => {
		it( 'should be empty on new editor', () => {
			const editor = new Editor();

			expect( getPlugins( editor ) ).to.be.empty;
		} );
	} );

	describe( 'locale', () => {
		it( 'is instantiated and t() is exposed', () => {
			const editor = new Editor();

			expect( editor.locale ).to.be.instanceof( Locale );
			expect( editor.t ).to.equal( editor.locale.t );
		} );

		it( 'is configured with the config.language', () => {
			const editor = new Editor( { language: 'pl' } );

			expect( editor.locale.language ).to.equal( 'pl' );
		} );
	} );

	describe( 'state', () => {
		it( 'is `initializing` initially', () => {
			const editor = new Editor();

			expect( editor.state ).to.equal( 'initializing' );
		} );

		it( 'is `ready` after initialization chain', () => {
			return Editor.create().then( editor => {
				expect( editor.state ).to.equal( 'ready' );

				return editor.destroy();
			} );
		} );

		it( 'is `destroyed` after editor destroy', () => {
			return Editor.create().then( editor => {
				return editor.destroy().then( () => {
					expect( editor.state ).to.equal( 'destroyed' );
				} );
			} );
		} );

		it( 'is observable', () => {
			const editor = new Editor();
			const spy = sinon.spy();

			editor.on( 'change:state', spy );

			editor.state = 'ready';

			sinon.assert.calledOnce( spy );
		} );

		it( 'reacts on #ready event', done => {
			const editor = new Editor();

			expect( editor.state ).to.equal( 'initializing' );

			editor.on( 'ready', () => {
				expect( editor.state ).to.equal( 'ready' );
				done();
			} );

			editor.fire( 'ready' );
		} );

		it( 'reacts on #destroy event', done => {
			const editor = new Editor();

			expect( editor.state ).to.equal( 'initializing' );

			editor.on( 'destroy', () => {
				expect( editor.state ).to.equal( 'destroyed' );
				done();
			} );

			editor.fire( 'destroy' );
		} );
	} );

	describe( 'isReadOnly', () => {
		it( 'is false initially', () => {
			const editor = new Editor();

			expect( editor.isReadOnly ).to.false;
		} );

		it( 'is observable', () => {
			const editor = new Editor();
			const spy = sinon.spy();

			editor.on( 'change:isReadOnly', spy );

			editor.isReadOnly = true;

			sinon.assert.calledOnce( spy );
		} );
	} );

	describe( 'conversion', () => {
		it( 'should have conversion property', () => {
			const editor = new Editor();

			expect( editor ).to.have.property( 'conversion' );
		} );

		it( 'should have defined default conversion groups', () => {
			const editor = new Editor();

			expect( () => {
				// Would throw if any of this group won't exist.
				editor.conversion.for( 'downcast' );
				editor.conversion.for( 'editingDowncast' );
				editor.conversion.for( 'dataDowncast' );
				editor.conversion.for( 'upcast' );
			} ).not.to.throw();
		} );
	} );

	describe( 'destroy()', () => {
		it( 'should fire "destroy"', () => {
			return Editor.create().then( editor => {
				const spy = sinon.spy();

				editor.on( 'destroy', spy );

				return editor.destroy().then( () => {
					expect( spy.calledOnce ).to.be.true;
				} );
			} );
		} );

		it( 'should destroy all components it initialized', () => {
			return Editor.create().then( editor => {
				const dataDestroySpy = sinon.spy( editor.data, 'destroy' );
				const modelDestroySpy = sinon.spy( editor.model, 'destroy' );
				const editingDestroySpy = sinon.spy( editor.editing, 'destroy' );
				const pluginsDestroySpy = sinon.spy( editor.plugins, 'destroy' );
				const keystrokesDestroySpy = sinon.spy( editor.keystrokes, 'destroy' );

				return editor.destroy()
					.then( () => {
						sinon.assert.calledOnce( dataDestroySpy );
						sinon.assert.calledOnce( modelDestroySpy );
						sinon.assert.calledOnce( editingDestroySpy );
						sinon.assert.calledOnce( pluginsDestroySpy );
						sinon.assert.calledOnce( keystrokesDestroySpy );
					} );
			} );
		} );

		it( 'should wait for the full init before destroying', done => {
			const spy = sinon.spy();
			const editor = new Editor();

			editor.on( 'destroy', () => {
				done();
			} );

			editor.destroy();

			sinon.assert.notCalled( spy );

			editor.fire( 'ready' );
		} );
	} );

	describe( 'execute()', () => {
		it( 'should execute specified command', () => {
			class SomeCommand extends Command {
				execute() {}
			}

			const editor = new Editor();

			const command = new SomeCommand( editor );
			sinon.spy( command, 'execute' );

			editor.commands.add( 'someCommand', command );
			editor.execute( 'someCommand' );

			expect( command.execute.calledOnce ).to.be.true;
		} );

		it( 'should throw an error if specified command has not been added', () => {
			const editor = new Editor();

			expect( () => {
				editor.execute( 'command' );
			} ).to.throw( CKEditorError, /^commandcollection-command-not-found:/ );
		} );
	} );

	describe( 'create()', () => {
		it( 'should return a promise that resolves properly', () => {
			const promise = Editor.create();

			expect( promise ).to.be.an.instanceof( Promise );

			return promise;
		} );

		it( 'loads plugins', () => {
			return Editor.create( { plugins: [ PluginA ] } )
				.then( editor => {
					expect( getPlugins( editor ).length ).to.equal( 1 );

					expect( editor.plugins.get( PluginA ) ).to.be.an.instanceof( Plugin );
				} );
		} );

		it( 'fires all events in the right order', () => {
			const fired = [];

			function spy( evt ) {
				fired.push( evt.name );
			}

			class EventWatcher extends Plugin {
				init() {
					this.editor.on( 'pluginsReady', spy );
					this.editor.on( 'dataReady', spy );
					this.editor.on( 'ready', spy );
				}
			}

			return Editor.create( { plugins: [ EventWatcher ] } )
				.then( () => {
					expect( fired ).to.deep.equal( [ 'pluginsReady', 'dataReady', 'ready' ] );
				} );
		} );
	} );

	describe( 'initPlugins()', () => {
		it( 'should load plugins', () => {
			const editor = new Editor( {
				plugins: [ PluginA, PluginB ]
			} );

			expect( getPlugins( editor ) ).to.be.empty;

			return editor.initPlugins().then( () => {
				expect( getPlugins( editor ).length ).to.equal( 2 );

				expect( editor.plugins.get( PluginA ) ).to.be.an.instanceof( Plugin );
				expect( editor.plugins.get( PluginB ) ).to.be.an.instanceof( Plugin );
			} );
		} );

		it( 'should initialize plugins in the right order', () => {
			const editor = new Editor( {
				plugins: [ PluginA, PluginD ]
			} );

			const pluginsReadySpy = sinon.spy().named( 'pluginsReady' );
			editor.on( 'pluginsReady', pluginsReadySpy );

			return editor.initPlugins()
				.then( () => {
					sinon.assert.callOrder(
						editor.plugins.get( PluginA ).init,
						editor.plugins.get( PluginB ).init,
						editor.plugins.get( PluginC ).init,
						editor.plugins.get( PluginD ).init,
						editor.plugins.get( PluginA ).afterInit,
						editor.plugins.get( PluginB ).afterInit,
						editor.plugins.get( PluginC ).afterInit,
						editor.plugins.get( PluginD ).afterInit,
						pluginsReadySpy
					);
				} );
		} );

		it( 'should initialize plugins in the right order, waiting for asynchronous init()', () => {
			const asyncSpy = sinon.spy().named( 'async-call-spy' );

			// Synchronous plugin that depends on an asynchronous one.
			class PluginSync extends Plugin {
				constructor( editor ) {
					super( editor );
					this.init = sinon.spy().named( 'sync' );
				}

				static get requires() {
					return [ PluginAsync ];
				}
			}

			class PluginAsync extends Plugin {
				constructor( editor ) {
					super( editor );

					this.init = sinon.spy( () => {
						return new Promise( resolve => {
							setTimeout( () => {
								asyncSpy();
								resolve();
							}, 0 );
						} );
					} );
				}
			}

			const editor = new Editor( {
				plugins: [ PluginA, PluginSync ]
			} );

			return editor.initPlugins()
				.then( () => {
					sinon.assert.callOrder(
						editor.plugins.get( PluginA ).init,
						editor.plugins.get( PluginAsync ).init,
						// This one is called with delay by the async init.
						asyncSpy,
						editor.plugins.get( PluginSync ).init
					);
				} );
		} );

		it( 'should initialize plugins in the right order, waiting for asynchronous afterInit()', () => {
			const asyncSpy = sinon.spy().named( 'async-call-spy' );

			// Synchronous plugin that depends on an asynchronous one.
			class PluginSync extends Plugin {
				constructor( editor ) {
					super( editor );
					this.afterInit = sinon.spy().named( 'sync' );
				}

				static get requires() {
					return [ PluginAsync ];
				}
			}

			class PluginAsync extends Plugin {
				constructor( editor ) {
					super( editor );

					this.afterInit = sinon.spy( () => {
						return new Promise( resolve => {
							setTimeout( () => {
								asyncSpy();
								resolve();
							}, 0 );
						} );
					} );
				}
			}

			const editor = new Editor( {
				plugins: [ PluginA, PluginSync ]
			} );

			return editor.initPlugins()
				.then( () => {
					sinon.assert.callOrder(
						editor.plugins.get( PluginA ).afterInit,
						editor.plugins.get( PluginAsync ).afterInit,

						// This one is called with delay by the async init.
						asyncSpy,
						editor.plugins.get( PluginSync ).afterInit
					);
				} );
		} );

		it( 'should load plugins built in the Editor even if the passed config is empty', () => {
			Editor.builtinPlugins = [ PluginA, PluginB, PluginC ];

			const editor = new Editor();

			return editor.initPlugins()
				.then( () => {
					expect( getPlugins( editor ).length ).to.equal( 3 );

					expect( editor.plugins.get( PluginA ) ).to.be.an.instanceof( Plugin );
					expect( editor.plugins.get( PluginB ) ).to.be.an.instanceof( Plugin );
					expect( editor.plugins.get( PluginC ) ).to.be.an.instanceof( Plugin );
				} );
		} );

		it( 'should load plugins provided in the config and should ignore plugins built in the Editor', () => {
			Editor.builtinPlugins = [ PluginA, PluginB, PluginC, PluginD ];

			const editor = new Editor( {
				plugins: [
					'A'
				]
			} );

			return editor.initPlugins()
				.then( () => {
					expect( getPlugins( editor ).length ).to.equal( 1 );

					expect( editor.plugins.get( PluginA ) ).to.be.an.instanceof( Plugin );
				} );
		} );

		it( 'should load plugins built in the Editor using their names', () => {
			class PrivatePlugin extends Plugin {}

			Editor.builtinPlugins = [ PluginA, PluginB, PluginC, PluginD ];

			const editor = new Editor( {
				plugins: [
					'A',
					'B',
					'C',
					PrivatePlugin
				]
			} );

			return editor.initPlugins()
				.then( () => {
					expect( getPlugins( editor ).length ).to.equal( 4 );

					expect( editor.plugins.get( PluginA ) ).to.be.an.instanceof( Plugin );
					expect( editor.plugins.get( PluginB ) ).to.be.an.instanceof( Plugin );
					expect( editor.plugins.get( PluginC ) ).to.be.an.instanceof( Plugin );
					expect( editor.plugins.get( PrivatePlugin ) ).to.be.an.instanceof( PrivatePlugin );
				} );
		} );

		it( 'should load plugins inherited from the base Editor', () => {
			Editor.builtinPlugins = [ PluginA, PluginB, PluginC, PluginD ];

			class CustomEditor extends Editor {}

			const editor = new CustomEditor( {
				plugins: [
					'D'
				]
			} );

			return editor.initPlugins()
				.then( () => {
					expect( getPlugins( editor ).length ).to.equal( 3 );

					expect( editor.plugins.get( PluginB ) ).to.be.an.instanceof( Plugin );
					expect( editor.plugins.get( PluginC ) ).to.be.an.instanceof( Plugin );
					expect( editor.plugins.get( PluginD ) ).to.be.an.instanceof( Plugin );
				} );
		} );

		it( 'should load plugins build into Editor\'s subclass', () => {
			class CustomEditor extends Editor {}

			CustomEditor.builtinPlugins = [ PluginA, PluginB, PluginC, PluginD ];

			const editor = new CustomEditor( {
				plugins: [
					'D'
				]
			} );

			return editor.initPlugins()
				.then( () => {
					expect( getPlugins( editor ).length ).to.equal( 3 );

					expect( editor.plugins.get( PluginB ) ).to.be.an.instanceof( Plugin );
					expect( editor.plugins.get( PluginC ) ).to.be.an.instanceof( Plugin );
					expect( editor.plugins.get( PluginD ) ).to.be.an.instanceof( Plugin );
				} );
		} );

		describe( '"removePlugins" config', () => {
			it( 'should prevent plugins from being loaded', () => {
				const editor = new Editor( {
					plugins: [ PluginA, PluginD ],
					removePlugins: [ PluginD ]
				} );

				return editor.initPlugins()
					.then( () => {
						expect( getPlugins( editor ).length ).to.equal( 1 );
						expect( editor.plugins.get( PluginA ) ).to.be.an.instanceof( Plugin );
					} );
			} );

			it( 'should not load plugins built in the Editor', () => {
				Editor.builtinPlugins = [ PluginA, PluginD ];

				const editor = new Editor( {
					removePlugins: [ 'D' ]
				} );

				return editor.initPlugins()
					.then( () => {
						expect( getPlugins( editor ).length ).to.equal( 1 );
						expect( editor.plugins.get( PluginA ) ).to.be.an.instanceof( Plugin );
					} );
			} );

			it( 'should not load plugins build into Editor\'s subclass', () => {
				class CustomEditor extends Editor {}

				CustomEditor.builtinPlugins = [ PluginA, PluginD ];

				const editor = new CustomEditor( {
					removePlugins: [ 'D' ]
				} );

				return editor.initPlugins()
					.then( () => {
						expect( getPlugins( editor ).length ).to.equal( 1 );
						expect( editor.plugins.get( PluginA ) ).to.not.be.undefined;
					} );
			} );
		} );

		describe( '"extraPlugins" config', () => {
			it( 'should load additional plugins', () => {
				const editor = new Editor( {
					plugins: [ PluginA, PluginC ],
					extraPlugins: [ PluginB ]
				} );

				return editor.initPlugins()
					.then( () => {
						expect( getPlugins( editor ).length ).to.equal( 3 );
						expect( editor.plugins.get( PluginB ) ).to.be.an.instanceof( Plugin );
					} );
			} );

			it( 'should not duplicate plugins', () => {
				const editor = new Editor( {
					plugins: [ PluginA, PluginB ],
					extraPlugins: [ PluginB ]
				} );

				return editor.initPlugins()
					.then( () => {
						expect( getPlugins( editor ).length ).to.equal( 2 );
						expect( editor.plugins.get( PluginB ) ).to.be.an.instanceof( Plugin );
					} );
			} );

			it( 'should not duplicate plugins built in the Editor', () => {
				Editor.builtinPlugins = [ PluginA, PluginB ];

				const editor = new Editor( {
					extraPlugins: [ 'B' ]
				} );

				return editor.initPlugins()
					.then( () => {
						expect( getPlugins( editor ).length ).to.equal( 2 );
						expect( editor.plugins.get( PluginB ) ).to.be.an.instanceof( Plugin );
					} );
			} );

			it( 'should not duplicate plugins build into Editor\'s subclass', () => {
				class CustomEditor extends Editor {}

				CustomEditor.builtinPlugins = [ PluginA, PluginB ];

				const editor = new CustomEditor( {
					extraPlugins: [ 'B' ]
				} );

				return editor.initPlugins()
					.then( () => {
						expect( getPlugins( editor ).length ).to.equal( 2 );
						expect( editor.plugins.get( PluginB ) ).to.be.an.instanceof( Plugin );
					} );
			} );
		} );

		it( 'should not call "afterInit" method if plugin does not have this method', () => {
			const editor = new Editor( {
				plugins: [ PluginA, PluginE ]
			} );

			const pluginsReadySpy = sinon.spy().named( 'pluginsReady' );
			editor.on( 'pluginsReady', pluginsReadySpy );

			return editor.initPlugins()
				.then( () => {
					sinon.assert.callOrder(
						editor.plugins.get( PluginA ).init,
						editor.plugins.get( PluginE ).init,
						editor.plugins.get( PluginA ).afterInit,
						pluginsReadySpy
					);
				} );
		} );

		it( 'should not call "init" method if plugin does not have this method', () => {
			const editor = new Editor( {
				plugins: [ PluginA, PluginF ]
			} );

			const pluginsReadySpy = sinon.spy().named( 'pluginsReady' );
			editor.on( 'pluginsReady', pluginsReadySpy );

			return editor.initPlugins()
				.then( () => {
					sinon.assert.callOrder(
						editor.plugins.get( PluginA ).init,
						editor.plugins.get( PluginA ).afterInit,
						editor.plugins.get( PluginF ).afterInit,
						pluginsReadySpy
					);
				} );
		} );
	} );
} );

function getPlugins( editor ) {
	return Array.from( editor.plugins )
		.map( entry => entry[ 1 ] ); // Get instances.
}
