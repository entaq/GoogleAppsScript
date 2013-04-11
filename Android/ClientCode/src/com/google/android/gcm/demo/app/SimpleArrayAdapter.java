package com.google.android.gcm.demo.app;

import java.util.ArrayList;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

public class SimpleArrayAdapter extends ArrayAdapter<Item> {
	private final Context context;
	private final ArrayList<Item> values;

	public SimpleArrayAdapter(Context context, ArrayList<Item> values) {
		super(context, R.layout.rowlayout, values);
		this.context = context;
		this.values = values;
	}

	@Override
	public View getView(int position, View convertView, ViewGroup parent) {
		LayoutInflater inflater = (LayoutInflater) context
				.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		View rowView = inflater.inflate(R.layout.rowlayout, parent, false);
		Item i = values.get(position);


		TextView nameTextView = (TextView) rowView.findViewById(R.id.inventoryName);
		TextView countTextView = (TextView) rowView.findViewById(R.id.inventoryCount);
		nameTextView.setText(i.name);

		countTextView.setText(i.count);

		return rowView;
	}
} 