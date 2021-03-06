/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import VirtaulTestEditor from './_utils/virtualtesteditor';
import PendingActions from '../src/pendingactions';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';

let editor, pendingActions;

beforeEach( () => {
	return VirtaulTestEditor.create( {
		plugins: [ PendingActions ],
	} ).then( newEditor => {
		editor = newEditor;
		pendingActions = editor.plugins.get( PendingActions );
	} );
} );

afterEach( () => {
	return editor.destroy();
} );

describe( 'PendingActions', () => {
	it( 'should define static pluginName property', () => {
		expect( PendingActions ).to.have.property( 'pluginName', 'PendingActions' );
	} );

	describe( 'init()', () => {
		it( 'should have hasAny observable', () => {
			const spy = sinon.spy();

			pendingActions.on( 'change:hasAny', spy );

			expect( pendingActions ).to.have.property( 'hasAny', false );

			pendingActions.hasAny = true;

			sinon.assert.calledOnce( spy );
		} );
	} );

	describe( 'add()', () => {
		it( 'should register and return pending action', () => {
			const action = pendingActions.add( 'Action' );

			expect( action ).be.an( 'object' );
			expect( action.message ).to.equal( 'Action' );
		} );

		it( 'should return observable', () => {
			const spy = sinon.spy();
			const action = pendingActions.add( 'Action' );

			action.on( 'change:message', spy );

			action.message = 'New message';

			sinon.assert.calledOnce( spy );
		} );

		it( 'should update hasAny observable', () => {
			expect( pendingActions ).to.have.property( 'hasAny', false );

			pendingActions.add( 'Action' );

			expect( pendingActions ).to.have.property( 'hasAny', true );
		} );

		it( 'should throw an error when invalid message is given', () => {
			expect( () => {
				pendingActions.add( {} );
			} ).to.throw( CKEditorError, /^pendingactions-add-invalid-message/ );
		} );

		it( 'should fire add event with added item', () => {
			const spy = sinon.spy();

			pendingActions.on( 'add', spy );

			const action = pendingActions.add( 'Some action' );

			sinon.assert.calledWith( spy, sinon.match.any, action );
		} );
	} );

	describe( 'remove()', () => {
		it( 'should remove given pending action and update observable', () => {
			const action1 = pendingActions.add( 'Action 1' );
			const action2 = pendingActions.add( 'Action 2' );

			expect( pendingActions ).to.have.property( 'hasAny', true );

			pendingActions.remove( action1 );

			expect( pendingActions ).to.have.property( 'hasAny', true );

			pendingActions.remove( action2 );

			expect( pendingActions ).to.have.property( 'hasAny', false );
		} );

		it( 'should fire remove event with removed item', () => {
			const spy = sinon.spy();

			pendingActions.on( 'remove', spy );

			const action = pendingActions.add( 'Some action' );

			pendingActions.remove( action );

			sinon.assert.calledWith( spy, sinon.match.any, action );
		} );
	} );

	describe( 'first', () => {
		it( 'should return first pending action from the list', () => {
			const action = pendingActions.add( 'Action 1' );

			pendingActions.add( 'Action 2' );

			expect( pendingActions.first ).to.equal( action );
		} );
	} );

	describe( 'iterator', () => {
		it( 'should return all panding actions', () => {
			pendingActions.add( 'Action 1' );
			pendingActions.add( 'Action 2' );

			expect( Array.from( pendingActions, action => action.message ) ).to.have.members( [ 'Action 1', 'Action 2' ] );
		} );
	} );
} );
