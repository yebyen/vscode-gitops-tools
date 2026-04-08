import * as assert from 'assert';
import * as vscode from 'vscode';
import { HelmReleaseDetector } from '../../language/helmReleaseDetector';

suite('HelmReleaseDetector Test Suite', () => {
	let detector: HelmReleaseDetector;

	setup(() => {
		detector = new HelmReleaseDetector();
	});

	suite('containsHelmRelease', () => {
		test('should return true for valid HelmRelease document', async () => {
			const content = `
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: traefik
  namespace: default
spec:
  chart:
    spec:
      chart: traefik
      sourceRef:
        kind: HelmRepository
        name: traefik
  values:
    dashboard:
      enabled: true
`;
			const doc = await vscode.workspace.openTextDocument({
				language: 'yaml',
				content
			});
			
			assert.strictEqual(detector.containsHelmRelease(doc), true);
		});

		test('should return false for non-HelmRelease YAML', async () => {
			const content = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
data:
  key: value
`;
			const doc = await vscode.workspace.openTextDocument({
				language: 'yaml',
				content
			});
			
			assert.strictEqual(detector.containsHelmRelease(doc), false);
		});

		test('should return false for non-YAML documents', async () => {
			const content = `
{
  "apiVersion": "helm.toolkit.fluxcd.io/v2",
  "kind": "HelmRelease"
}
`;
			const doc = await vscode.workspace.openTextDocument({
				language: 'json',
				content
			});
			
			assert.strictEqual(detector.containsHelmRelease(doc), false);
		});
	});

	suite('detectHelmReleases', () => {
		test('should detect single HelmRelease with all fields', async () => {
			const content = `
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: traefik
  namespace: default
spec:
  chart:
    spec:
      chart: traefik
      version: "10.0.0"
      sourceRef:
        kind: HelmRepository
        name: traefik-repo
        namespace: flux-system
  values:
    dashboard:
      enabled: true
`;
			const doc = await vscode.workspace.openTextDocument({
				language: 'yaml',
				content
			});
			
			const releases = detector.detectHelmReleases(doc);
			
			assert.strictEqual(releases.length, 1);
			assert.strictEqual(releases[0].name, 'traefik');
			assert.strictEqual(releases[0].namespace, 'default');
			assert.strictEqual(releases[0].chartName, 'traefik');
			assert.strictEqual(releases[0].chartVersion, '10.0.0');
			assert.strictEqual(releases[0].sourceRefKind, 'HelmRepository');
			assert.strictEqual(releases[0].sourceRefName, 'traefik-repo');
			assert.strictEqual(releases[0].sourceRefNamespace, 'flux-system');
		});

		test('should detect multiple HelmReleases in multi-document YAML', async () => {
			const content = `
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: app1
spec:
  chart:
    spec:
      chart: nginx
      sourceRef:
        kind: HelmRepository
        name: bitnami
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: app2
spec:
  chart:
    spec:
      chart: redis
      sourceRef:
        kind: HelmRepository
        name: bitnami
`;
			const doc = await vscode.workspace.openTextDocument({
				language: 'yaml',
				content
			});
			
			const releases = detector.detectHelmReleases(doc);
			
			assert.strictEqual(releases.length, 2);
			assert.strictEqual(releases[0].name, 'app1');
			assert.strictEqual(releases[0].chartName, 'nginx');
			assert.strictEqual(releases[1].name, 'app2');
			assert.strictEqual(releases[1].chartName, 'redis');
		});

		test('should detect valuesRange when values field is present', async () => {
			const content = `
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: test
spec:
  chart:
    spec:
      chart: test-chart
      sourceRef:
        kind: HelmRepository
        name: test-repo
  values:
    key1: value1
    key2: value2
`;
			const doc = await vscode.workspace.openTextDocument({
				language: 'yaml',
				content
			});
			
			const releases = detector.detectHelmReleases(doc);
			
			assert.strictEqual(releases.length, 1);
			assert.notStrictEqual(releases[0].valuesRange, undefined);
		});

		test('should handle HelmRelease without values field', async () => {
			const content = `
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: no-values
spec:
  chart:
    spec:
      chart: simple-chart
      sourceRef:
        kind: HelmRepository
        name: my-repo
`;
			const doc = await vscode.workspace.openTextDocument({
				language: 'yaml',
				content
			});
			
			const releases = detector.detectHelmReleases(doc);
			
			assert.strictEqual(releases.length, 1);
			assert.strictEqual(releases[0].name, 'no-values');
			assert.strictEqual(releases[0].valuesRange, undefined);
		});

		test('should return empty array for non-YAML documents', async () => {
			const doc = await vscode.workspace.openTextDocument({
				language: 'json',
				content: '{}'
			});
			
			const releases = detector.detectHelmReleases(doc);
			
			assert.strictEqual(releases.length, 0);
		});
	});

	suite('isPositionInValues', () => {
		test('should return true when position is inside values block', async () => {
			const content = `
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: test
spec:
  chart:
    spec:
      chart: test-chart
      sourceRef:
        kind: HelmRepository
        name: test-repo
  values:
    key1: value1
    nested:
      key2: value2
`;
			const doc = await vscode.workspace.openTextDocument({
				language: 'yaml',
				content
			});
			
			// Position on "key1: value1" line
			const position = new vscode.Position(14, 10);
			
			assert.strictEqual(detector.isPositionInValues(doc, position), true);
		});

		test('should return false when position is outside values block', async () => {
			const content = `
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: test
spec:
  chart:
    spec:
      chart: test-chart
      sourceRef:
        kind: HelmRepository
        name: test-repo
  values:
    key1: value1
`;
			const doc = await vscode.workspace.openTextDocument({
				language: 'yaml',
				content
			});
			
			// Position on "metadata:" line
			const position = new vscode.Position(3, 5);
			
			assert.strictEqual(detector.isPositionInValues(doc, position), false);
		});
	});

	suite('getHelmReleaseAtPosition', () => {
		test('should return HelmRelease info when position is inside a HelmRelease', async () => {
			const content = `
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: my-release
spec:
  chart:
    spec:
      chart: my-chart
      sourceRef:
        kind: HelmRepository
        name: my-repo
`;
			const doc = await vscode.workspace.openTextDocument({
				language: 'yaml',
				content
			});
			
			// Position somewhere in the middle of the document
			const position = new vscode.Position(5, 0);
			
			const release = detector.getHelmReleaseAtPosition(doc, position);
			
			assert.notStrictEqual(release, undefined);
			assert.strictEqual(release?.name, 'my-release');
		});

		test('should return undefined when position is not in a HelmRelease', async () => {
			const content = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: my-release
spec:
  chart:
    spec:
      chart: my-chart
      sourceRef:
        kind: HelmRepository
        name: my-repo
`;
			const doc = await vscode.workspace.openTextDocument({
				language: 'yaml',
				content
			});
			
			// Position in ConfigMap section
			const position = new vscode.Position(3, 0);
			
			const release = detector.getHelmReleaseAtPosition(doc, position);
			
			assert.strictEqual(release, undefined);
		});
	});
});